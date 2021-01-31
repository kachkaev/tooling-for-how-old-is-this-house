import * as turf from "@turf/turf";
import chalk from "chalk";
import _ from "lodash";
import path from "path";

import { writeFormattedJson } from "../../helpersForJson";
import { combineTiles } from "./combineTiles";
import { getObjectDirPath } from "./helpersForPaths";
import { ObjectType } from "./types";

export const combineTilesAndSavePreviews = async ({
  objectType,
  logger,
}: {
  objectType: ObjectType;
  logger: Console;
}): Promise<void> => {
  const {
    objectCenterFeatures: featureCenters,
    objectExtentFeatures: featureExtents,
    tileExtentFeatures: tileExtents,
  } = await combineTiles({
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
