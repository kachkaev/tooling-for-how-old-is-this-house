import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import { WriteStream } from "node:tty";
import sortKeys from "sort-keys";

import { processFiles } from "../process-files";
import { stringifyTile } from "../tiles";
import { convertCnToId } from "./helpers-for-cn";
import { getTileDataFileName, getTilesDirPath } from "./helpers-for-paths";
import { deriveRosreestrTileDataStatus } from "./helpers-for-tile-processing";
import {
  ObjectCenterFeature,
  ObjectExtentFeature,
  RosreestrObjectType,
  RosreestrTileData,
  RosreestrTileExtentFeature,
} from "./types";

export const combineRosreestrTiles = async ({
  objectType,
  output,
}: {
  objectType: RosreestrObjectType;
  output?: WriteStream | undefined;
}): Promise<{
  objectCenterFeatures: ObjectCenterFeature[];
  objectExtentFeatures: ObjectExtentFeature[];
  tileExtentFeatures: RosreestrTileExtentFeature[];
}> => {
  const rawObjectExtentFeatures: ObjectExtentFeature[] = [];
  const rawObjectCenterFeatures: ObjectCenterFeature[] = [];
  const tileExtentFeatures: RosreestrTileExtentFeature[] = [];

  await processFiles({
    fileSearchPattern: `**/${getTileDataFileName()}`,
    fileSearchDirPath: getTilesDirPath(objectType),
    filesNicknameToLog: "rosreestr tile data files",
    output,
    statusReportFrequency: 1000,
    processFile: async (filePath) => {
      const tileData = (await fs.readJson(filePath)) as RosreestrTileData;

      const tileId = stringifyTile(tileData.tile);

      tileExtentFeatures.push(
        turf.feature(tileData.fetchedExtent, {
          tileId,
          fetchedAt: tileData.fetchedAt,
          fetchedFeatureCount: tileData.response.features.length,
        }),
      );

      if (deriveRosreestrTileDataStatus(tileData) !== "complete") {
        return;
      }

      for (const responseFeature of tileData.response.features) {
        const { cn, id } = responseFeature.attrs;
        const derivedId = convertCnToId(cn);
        if (derivedId !== id) {
          output?.write(
            chalk.red(
              `Id mismatch detected for object with cn ${cn}: Derived id is ${derivedId}, while real id is ${id}. Downstream scripts may fail.\n`,
            ),
          );
        }

        const center: ObjectCenterFeature = turf.toWgs84(
          turf.point(
            responseFeature.center,
            sortKeys({
              tileId,
              ...responseFeature.attrs,
            }),
          ),
        );

        const plainExtent = turf.toWgs84(
          turf.bboxPolygon(responseFeature.extent),
        );
        const extent: ObjectExtentFeature = turf.feature(plainExtent.geometry, {
          cn,
        });

        // Creating two separate features because QGIS cannot render GeometryCollection
        // https://github.com/qgis/QGIS/issues/32747#issuecomment-770267561
        rawObjectCenterFeatures.push(center);
        rawObjectExtentFeatures.push(extent);
      }
    },
  });

  output?.write(chalk.green("Deduplicating features..."));

  const objectCenterFeatures = _.uniqBy(
    rawObjectCenterFeatures,
    (feature) => feature.properties.cn,
  );

  const objectExtentFeatures = _.uniqBy(
    rawObjectExtentFeatures,
    (feature) => feature.properties.cn,
  );

  output?.write(
    ` Count reduced from ${rawObjectExtentFeatures.length} to ${objectExtentFeatures.length}.\n`,
  );

  return {
    objectCenterFeatures,
    objectExtentFeatures,
    tileExtentFeatures,
  };
};
