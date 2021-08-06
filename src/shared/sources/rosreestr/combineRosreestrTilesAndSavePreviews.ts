import * as turf from "@turf/turf";
import chalk from "chalk";
import _ from "lodash";
import path from "path";

import { ensureTerritoryGitignoreContainsPreview } from "../../helpersForCommands";
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
    objectCenterFeatures,
    objectExtentFeatures,
    tileExtentFeatures,
  } = await combineRosreestrTiles({
    objectType,
    logger,
  });

  logger.log(chalk.green("Saving..."));

  await ensureTerritoryGitignoreContainsPreview();

  for (const [features, name] of [
    [objectCenterFeatures, "Object centers"],
    [objectExtentFeatures, "Object extents"],
    [tileExtentFeatures, "Tile extents"],
  ] as const) {
    const filePath = path.resolve(
      getObjectDirPath(objectType),
      `preview--${_.kebabCase(name)}.geojson`,
    );

    await writeFormattedJson(
      filePath,
      turf.featureCollection<turf.Polygon | turf.Point>(features),
    );
    logger.log(`${name} saved to ${chalk.magenta(filePath)}`);
  }
};
