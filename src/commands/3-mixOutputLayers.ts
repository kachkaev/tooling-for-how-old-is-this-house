import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

import { getSourcesDirPath } from "../shared/helpersForPaths";
import {
  getOutputLayerFileName,
  OutputLayer,
  OutputLayerProperties,
} from "../shared/output";
import { processFiles } from "../shared/processFiles";

const geometrySources = ["osm"];

type BaseLayerFeature = turf.Feature<
  turf.Polygon | turf.MultiPolygon,
  OutputLayerProperties
> & { bbox: turf.BBox };

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
        const features = outputLayer.features
          .filter(
            (feature) =>
              feature.geometry &&
              (feature.geometry.type === "Polygon" ||
                feature.geometry.type === "MultiPolygon"),
          )
          .map((feature) => ({
            ...feature,
            bbox: turf.bbox(feature),
          })) as BaseLayerFeature[];

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

        logPickedFeatures("convertable to points", features.length);

        mixinLayers.push({
          source,
          features,
          hash: `${knownAt ?? totalFeatureCount}`,
        });
      }
    },
  });
};

autoStartCommandIfNeeded(mixOutputLayers, __filename);
