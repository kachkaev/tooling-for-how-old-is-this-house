import * as turf from "@turf/turf";
import chalk from "chalk";
import _ from "lodash";
import path from "path";

import { writeFormattedJson } from "../../helpersForJson";
import { combineRosreestrTiles } from "./combineRosreestrTiles";
import { getObjectDirPath } from "./helpersForPaths";
import { RosreestrObjectType } from "./types";

export const combineRosreestrTilesAndSavePreviews = async ({
  objectType,
  logger,
}: {
  objectType: RosreestrObjectType;
  logger: Console;
}): Promise<void> => {
  const {
    objectCenterFeatures: featureCenters,
    objectExtentFeatures: featureExtents,
    tileExtentFeatures: tileExtents,
  } = await combineRosreestrTiles({
    objectType,
    logger,
  });

  logger.log(chalk.green("Saving..."));

  for (const [features, name] of [
    [featureCenters, "Feature centers"],
    [featureExtents, "Feature extents"],
    [tileExtents, "Tile extents"],
  ] as const) {
    const filePath = path.resolve(
      getObjectDirPath(objectType),
      `preview--${_.kebabCase(name)}.geojson`,
    );

    await writeFormattedJson(filePath, turf.featureCollection(features));
    logger.log(`${name} saved to ${chalk.magenta(filePath)}`);
  }
};
