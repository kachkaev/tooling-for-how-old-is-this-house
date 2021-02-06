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
import {
  WikimaiaTileExtentFeature,
  WikimapiaObjectExtentFeature,
  WikimapiaObjectPointFeature,
  WikimapiaTileData,
} from "./types";

// Commented lines can be used to determine the right zoom level
// type StatEntry = [value: number, id: string, zoom: number];
// const extentAreas: StatEntry[] = [];
// const extentBboxAreas: StatEntry[] = [];
// const tileAreaToExtentAreaRatios: StatEntry[] = [];
// const tileAreaToExtentBboxAreaRatios: StatEntry[] = [];

export const combineWikimapiaTiles = async ({
  logger,
}: {
  logger: Console;
}): Promise<{
  objectPointFeatures: WikimapiaObjectPointFeature[];
  objectExtentFeatures: WikimapiaObjectExtentFeature[];
  tileExtentFeatures: WikimaiaTileExtentFeature[];
}> => {
  const rawObjectPointFeatures: WikimapiaObjectPointFeature[] = [];
  const rawObjectExtentFeatures: WikimapiaObjectExtentFeature[] = [];
  const tileExtentFeatures: WikimaiaTileExtentFeature[] = [];

  await processFiles({
    logger,
    fileSearchPattern: `**/${getWikimapiaTileDataFileName()}`,
    fileSearchDirPath: getWikimapiaTilesDirPath(),
    statusReportFrequency: 500,
    processFile: async (filePath) => {
      const tileData = (await fs.readJson(filePath)) as WikimapiaTileData;

      const tileId = stringifyTile(tileData.tile);
      // const [, , currentTileZoom] = tileData.tile;

      const tileFeature = turf.feature(
        turf.bboxPolygon(tilebelt.tileToBBOX(tileData.tile) as turf.BBox)
          .geometry!,
        {
          tileId,
          fetchedAt: tileData.fetchedAt,
          fetchedFeatureCount: tileData.response.length,
        },
      );
      // const tileArea = turf.area(tileFeature);
      tileExtentFeatures.push(tileFeature);

      tileData.response.forEach((responseFeature) => {
        const responseFeatureIdMatch = `${responseFeature.id}`.match(
          /^wm([0-9]+)$/,
        );
        const wikimapiaId = parseInt(responseFeatureIdMatch?.[1] ?? "0");
        if (!wikimapiaId) {
          throw new Error(
            `Unexpected empty feature id ${wikimapiaId} as the result of an unexpected format: ${responseFeature.id}. Should be wm12345.`,
          );
        }

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
            `Unexpected contents of geometry fro feature ${wikimapiaId}. Expected on Point and one LineString`,
          );
        }

        const properties = sortKeys({
          wikimapiaId,
          ...responseFeature.properties,
        });

        const point = turf.point(pointGeometry.coordinates, properties);
        const extent = turf.polygon(
          [lineStringGeometry.coordinates],
          properties,
        );

        rawObjectPointFeatures.push(point);
        rawObjectExtentFeatures.push(extent);

        // const extentArea = turf.area(extent);
        // const extentBboxArea = turf.area(turf.bboxPolygon(turf.bbox(extent)));

        // extentAreas.push([extentArea, responseFeatureId, currentTileZoom]);
        // extentBboxAreas.push([
        //   extentBboxArea,
        //   responseFeatureId,
        //   currentTileZoom,
        // ]);

        // tileAreaToExtentAreaRatios.push([
        //   tileArea / extentArea,
        //   responseFeatureId,
        //   currentTileZoom,
        // ]);
        // tileAreaToExtentBboxAreaRatios.push([
        //   tileArea / extentBboxArea,
        //   responseFeatureId,
        //   currentTileZoom,
        // ]);
      });
    },
  });

  process.stdout.write(chalk.green("Deduplicating features..."));

  const objectPointFeatures = _.uniqBy(
    rawObjectPointFeatures,
    (feature) => feature.properties?.wikimapiaId,
  );

  const objectExtentFeatures = _.uniqBy(
    rawObjectExtentFeatures,
    (feature) => feature.properties?.wikimapiaId,
  );

  process.stdout.write(
    ` Count reduced from ${rawObjectExtentFeatures.length} to ${objectExtentFeatures.length}.\n`,
  );

  // logger.log({
  //   minExtentArea: _.orderBy(extentAreas, (t) => t[0]).slice(0, 10),
  //   minExtentBboxArea: _.orderBy(extentBboxAreas, (t) => t[0]).slice(0, 10),
  //   maxTileAreaToExtentAreaRatios: _.orderBy(extentAreas, (t) => -t[0]).slice(
  //     0,
  //     10,
  //   ),
  //   maxTileAreaToExtentBboxAreaRatios: _.orderBy(
  //     extentBboxAreas,
  //     (t) => -t[0],
  //   ).slice(0, 10),
  // });

  return {
    objectPointFeatures,
    objectExtentFeatures,
    tileExtentFeatures,
  };
};
