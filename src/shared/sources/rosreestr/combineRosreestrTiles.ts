import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import sortKeys from "sort-keys";

import { processFiles } from "../../processFiles";
import { stringifyTile } from "../../tiles";
import { convertCnToId } from "./helpersForCn";
import { getTileDataFileName, getTilesDirPath } from "./helpersForPaths";
import { deriveRosreestrTileDataStatus } from "./helpersForTileProcessing";
import {
  ObjectCenterFeature,
  ObjectExtentFeature,
  RosreestrObjectType,
  RosreestrTileData,
  RosreestrTileExtentFeature,
} from "./types";

export const combineRosreestrTiles = async ({
  objectType,
  logger,
}: {
  objectType: RosreestrObjectType;
  logger: Console;
}): Promise<{
  objectCenterFeatures: ObjectCenterFeature[];
  objectExtentFeatures: ObjectExtentFeature[];
  tileExtentFeatures: RosreestrTileExtentFeature[];
}> => {
  const rawObjectExtentFeatures: ObjectExtentFeature[] = [];
  const rawObjectCenterFeatures: ObjectCenterFeature[] = [];
  const tileExtentFeatures: RosreestrTileExtentFeature[] = [];

  await processFiles({
    logger,
    fileSearchPattern: `**/${getTileDataFileName()}`,
    fileSearchDirPath: getTilesDirPath(objectType),
    processFile: async (filePath) => {
      const tileData = (await fs.readJson(filePath)) as RosreestrTileData;
      if (deriveRosreestrTileDataStatus(tileData) !== "complete") {
        return;
      }

      const tileId = stringifyTile(tileData.tile);

      tileExtentFeatures.push(
        turf.feature(tileData.fetchedExtent, {
          tileId,
          fetchedAt: tileData.fetchedAt,
          fetchedFeatureCount: tileData.response.features.length,
        }),
      );

      tileData.response.features.forEach((responseFeature) => {
        const { cn, id } = responseFeature.attrs;
        const derivedId = convertCnToId(cn);
        if (derivedId !== id) {
          logger.log(
            chalk.red(
              `Id mismatch detected for object with cn ${responseFeature.attrs.cn}: Derived id is ${derivedId}, while real id is ${id}. Downstream scripts may fail.`,
            ),
          );
        }

        const center: ObjectCenterFeature = turf.toWgs84(
          turf.point(
            [responseFeature.center.x, responseFeature.center.y],
            sortKeys({
              tileId,
              ...responseFeature.attrs,
            }),
          ),
        );

        const plainExtent = turf.toWgs84(
          turf.bboxPolygon([
            responseFeature.extent.xmin,
            responseFeature.extent.ymin,
            responseFeature.extent.xmax,
            responseFeature.extent.ymax,
          ]),
        );
        const extent: ObjectExtentFeature = turf.feature(
          plainExtent.geometry!,
          { cn },
        );

        // Creating two separate features because QGIS cannot render GeometryCollection
        // https://github.com/qgis/QGIS/issues/32747#issuecomment-770267561
        rawObjectCenterFeatures.push(center);
        rawObjectExtentFeatures.push(extent);
      });
    },
  });

  process.stdout.write(chalk.green("Deduplicating features..."));

  const objectCenterFeatures = _.uniqBy(
    rawObjectCenterFeatures,
    (feature) => feature.properties?.cn,
  );

  const objectExtentFeatures = _.uniqBy(
    rawObjectExtentFeatures,
    (feature) => feature.properties?.cn,
  );

  process.stdout.write(
    ` Count reduced from ${rawObjectExtentFeatures.length} to ${objectExtentFeatures.length}.\n`,
  );

  return {
    objectCenterFeatures,
    objectExtentFeatures,
    tileExtentFeatures,
  };
};
