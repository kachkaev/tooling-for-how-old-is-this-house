import * as tilebelt from "@mapbox/tilebelt";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import sortKeys from "sort-keys";

import { processFiles } from "../../processFiles";
import { stringifyTile } from "../../tiles";
import {
  getWikimapiaTileDataFileName,
  getWikimapiaTilesDirPath,
} from "./helpersForPaths";
import { deriveWikimapiaTileDataStatus } from "./helpersForTiles";
import {
  WikimaiaTileExtentFeature,
  WikimapiaObjectPointFeature,
  WikimapiaObjectShapeFeature,
  WikimapiaTileData,
} from "./types";

export const combineWikimapiaTiles = async ({
  logger,
}: {
  logger: Console;
}): Promise<{
  objectPointFeatures: WikimapiaObjectPointFeature[];
  objectShapeFeatures: WikimapiaObjectShapeFeature[];
  tileExtentFeatures: WikimaiaTileExtentFeature[];
}> => {
  const rawObjectPointFeatures: WikimapiaObjectPointFeature[] = [];
  const rawObjectShapeFeatures: WikimapiaObjectShapeFeature[] = [];
  const tileExtentFeatures: WikimaiaTileExtentFeature[] = [];

  await processFiles({
    logger,
    fileSearchPattern: `**/${getWikimapiaTileDataFileName()}`,
    fileSearchDirPath: getWikimapiaTilesDirPath(),
    processFile: async (filePath) => {
      const tileData = (await fs.readJson(filePath)) as WikimapiaTileData;
      if (deriveWikimapiaTileDataStatus(tileData) !== "complete") {
        return;
      }

      const tileId = stringifyTile(tileData.tile);

      tileExtentFeatures.push(
        turf.feature(
          turf.bboxPolygon(tilebelt.tileToBBOX(tileData.tile) as turf.BBox)
            .geometry!,
          {
            tileId,
            fetchedAt: tileData.fetchedAt,
            fetchedFeatureCount: tileData.response.length,
          },
        ),
      );

      tileData.response.forEach((responseFeature) => {
        const pointGeometry = responseFeature.geometry?.geometries.find(
          (geometry): geometry is turf.Point => geometry.type === "Point",
        );
        const lineStringGeometry = responseFeature.geometry?.geometries.find(
          (geometry): geometry is turf.LineString =>
            geometry.type === "LineString",
        );
        if (
          !pointGeometry ||
          !lineStringGeometry ||
          responseFeature.geometry?.geometries.length !== 2
        ) {
          throw new Error(
            `Unexpected contents of geometry fro feature ${responseFeature.id}. Expected on Point and one LineString`,
          );
        }

        const properties = sortKeys({
          id: `${responseFeature.id}`,
          ...responseFeature.properties,
        });

        const point = turf.point(pointGeometry.coordinates, properties);
        const shape = turf.polygon(
          [lineStringGeometry.coordinates],
          properties,
        );

        rawObjectPointFeatures.push(point);
        rawObjectShapeFeatures.push(shape);
      });
    },
  });

  process.stdout.write(chalk.green("Deduplicating features..."));

  const objectPointFeatures = _.uniqBy(
    rawObjectPointFeatures,
    (feature) => feature.properties?.id,
  );

  const objectShapeFeatures = _.uniqBy(
    rawObjectShapeFeatures,
    (feature) => feature.properties?.id,
  );

  process.stdout.write(
    ` Count reduced from ${rawObjectShapeFeatures.length} to ${objectShapeFeatures.length}.\n`,
  );

  return {
    objectPointFeatures,
    objectShapeFeatures,
    tileExtentFeatures,
  };
};
