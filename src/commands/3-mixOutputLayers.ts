import {
  autoStartCommandIfNeeded,
  Command,
  CommandError,
} from "@kachkaev/commands";
import tilebelt from "@mapbox/tilebelt";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

import {
  addBufferToBbox,
  calculatePointDistanceToPolygonInMeters,
  deriveBboxCenter,
  isPointInBbox,
  unionBboxes,
} from "../shared/helpersForGeometry";
import { writeFormattedJson } from "../shared/helpersForJson";
import { getSourcesDirPath } from "../shared/helpersForPaths";
import {
  getMixedOutputLayersFileName,
  getOutputLayerFileName,
  MixedOutputLayersFeature,
  OutputLayer,
  OutputLayerFeatureWithGeometry,
  OutputLayerProperties,
  PropertyLookupVariant,
} from "../shared/output";
import { processFiles } from "../shared/processFiles";
import { getTerritoryExtent } from "../shared/territory";
import { processTiles } from "../shared/tiles";

const geometrySources = ["osm"];
const bufferSizeInMeters = 5;
const tileZoom = 15;

type BaseLayerFeature = turf.Feature<
  turf.Polygon | turf.MultiPolygon,
  OutputLayerProperties
> & {
  bbox: turf.BBox;
  bboxCenter: [x: number, y: number];
  bboxWithBuffer: turf.BBox;
};

interface BaseLayer {
  features: BaseLayerFeature[];
  source: string;
  hash: string;
}

type MixinLayerFeature = turf.Feature<turf.Point, OutputLayerProperties> & {
  bbox?: never;
};

interface MixinLayer {
  features: MixinLayerFeature[];
  source: string;
  hash: string;
}

export const mixOutputLayers: Command = async ({ logger }) => {
  logger.log(chalk.bold("Mixing output layers"));

  logger.log(chalk.green("Loading files..."));

  const baseLayers: BaseLayer[] = [];
  const mixinLayers: MixinLayer[] = [];

  await processFiles({
    logger,
    fileSearchPattern: `*/${getOutputLayerFileName()}`,
    fileSearchDirPath: getSourcesDirPath(),
    showFilePath: true,
    processFile: async (filePath, prefixLength) => {
      const prefix = " ".repeat(prefixLength + 1);

      const source = path.basename(path.dirname(filePath));
      logger.log(`${prefix}source: ${chalk.cyan(source)}`);

      const outputLayer = (await fs.readJson(filePath)) as OutputLayer;

      const layerType = geometrySources.includes(source) ? "base" : "mixin";
      logger.log(`${prefix}type: ${chalk.cyan(layerType)}`);

      const knownAt = outputLayer.properties?.knownAt;
      logger.log(`${prefix}known at: ${chalk.cyan(knownAt ?? "no date")}`);

      const totalFeatureCount = outputLayer.features.length;
      logger.log(`${prefix}total features: ${chalk.cyan(totalFeatureCount)}`);

      const logPickedFeatures = (geometryTypes: string, featureCount: number) =>
        logger.log(
          `${prefix}picked features (${geometryTypes}): ${chalk.cyan(
            featureCount,
          )} (${Math.round((featureCount / totalFeatureCount) * 100)}%)`,
        );

      if (layerType === "base") {
        const features: BaseLayerFeature[] = outputLayer.features
          .filter((feature): feature is OutputLayerFeatureWithGeometry =>
            Boolean(
              feature.geometry &&
                (feature.geometry.type === "Polygon" ||
                  feature.geometry.type === "MultiPolygon"),
            ),
          )
          .map((feature) => {
            const bbox = turf.bbox(feature);

            return {
              ...feature,
              bbox,
              bboxCenter: deriveBboxCenter(bbox),
              bboxWithBuffer: addBufferToBbox(bbox, bufferSizeInMeters),
            };
          });

        logPickedFeatures("polygons and multipolygons", features.length);

        baseLayers.push({
          source,
          features,
          hash: `${knownAt ?? totalFeatureCount}`,
        });
      } else {
        const features = outputLayer.features
          .filter((feature) => feature.geometry)
          .map((feature) => ({
            geometry: turf.pointOnFeature(feature as turf.Feature).geometry,
            properties: feature.properties,
          })) as MixinLayerFeature[];

        logPickedFeatures("convertible to points", features.length);

        mixinLayers.push({
          source,
          features,
          hash: `${knownAt ?? totalFeatureCount}`,
        });
      }
    },
  });

  if (!baseLayers.length) {
    throw new CommandError(
      `No base layers found. Expected at least one of: ${geometrySources.join(
        ", ",
      )}`,
    );
  }

  const mixedFeatures: MixedOutputLayersFeature[] = [];

  const territoryExtent = await getTerritoryExtent();
  await processTiles({
    territoryExtent,
    initialZoom: tileZoom,
    maxAllowedZoom: tileZoom,
    logger,
    processTile: async (tile) => {
      const tileBbox = tilebelt.tileToBBOX(tile) as turf.BBox;

      const filteredBaseLayers: BaseLayer[] = baseLayers.map((baseLayer) => ({
        ...baseLayer,
        features: baseLayer.features.filter((baseLayerFeature) =>
          isPointInBbox(baseLayerFeature.bboxCenter, tileBbox),
        ),
      }));

      const bboxWithBufferAroundBuildings = (() => {
        let result: turf.BBox | undefined = undefined;
        for (const filteredBaseLayer of filteredBaseLayers) {
          for (const baseLayerFeature of filteredBaseLayer.features) {
            if (!result) {
              result = baseLayerFeature.bboxWithBuffer;
            } else {
              result = unionBboxes(result, baseLayerFeature.bboxWithBuffer);
            }
          }
        }

        return result;
      })();

      if (!bboxWithBufferAroundBuildings) {
        return {
          cacheStatus: "used",
          tileStatus: "complete",
          comment: "mixed features: 0",
        };
      }

      const originalMixedFeatureCount = mixedFeatures.length;

      const filteredMixinLayers: MixinLayer[] = mixinLayers.map(
        (mixinLayer) => ({
          ...mixinLayer,
          features: mixinLayer.features.filter((feature) =>
            isPointInBbox(
              feature.geometry.coordinates,
              bboxWithBufferAroundBuildings,
            ),
          ),
        }),
      );

      for (const filteredBaseLayer of filteredBaseLayers) {
        for (const baseLayerFeature of filteredBaseLayer.features) {
          const propertiesVariants: PropertyLookupVariant[] = [
            {
              ...baseLayerFeature.properties,
              source: filteredBaseLayer.source,
              distance: 0,
            },
          ];

          for (const filteredMixinLayer of filteredMixinLayers) {
            for (const mixinLayerFeature of filteredMixinLayer.features) {
              if (
                !isPointInBbox(
                  mixinLayerFeature.geometry.coordinates,
                  baseLayerFeature.bboxWithBuffer,
                )
              ) {
                continue;
              }

              const distance = Math.max(
                0,
                calculatePointDistanceToPolygonInMeters(
                  mixinLayerFeature.geometry,
                  baseLayerFeature,
                ),
              );

              if (distance <= bufferSizeInMeters) {
                propertiesVariants.push({
                  ...mixinLayerFeature.properties,
                  source: filteredMixinLayer.source,
                  distance,
                });
              }
            }
          }

          mixedFeatures.push(
            turf.feature(baseLayerFeature.geometry, {
              geometrySource: filteredBaseLayer.source,
              variants: propertiesVariants,
            }),
          );
        }
      }

      return {
        cacheStatus: "notUsed",
        tileStatus: "complete",
        comment: `mixed features: ${
          mixedFeatures.length - originalMixedFeatureCount
        }`,
      };
    },
  });

  process.stdout.write(chalk.green(`Saving...`));

  const resultFileName = getMixedOutputLayersFileName();
  const mixedFeatureCollection = turf.featureCollection(mixedFeatures);
  await writeFormattedJson(resultFileName, mixedFeatureCollection);

  logger.log(` Result saved to ${chalk.magenta(resultFileName)}`);
};

autoStartCommandIfNeeded(mixOutputLayers, __filename);
