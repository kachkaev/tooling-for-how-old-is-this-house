import * as turf from "@turf/turf";
import chalk from "chalk";
import _ from "lodash";
import path from "path";

import { writeFormattedJson } from "../../helpersForJson";
import { combineTiles } from "./combineTiles";
import { getFeatureTypeDirPath } from "./helpersForPaths";
import { FeatureType } from "./types";

export const combineTilesAndSavePreviews = async ({
  featureType,
  logger,
}: {
  featureType: FeatureType;
  logger: Console;
}): Promise<void> => {
  const { featureCenters, featureExtents, tileExtents } = await combineTiles({
    featureType,
    logger,
  });

  logger.log(chalk.green("Saving..."));

  for (const [features, name] of [
    [featureCenters, "Feature centers"],
    [featureExtents, "Feature extents"],
    [tileExtents, "Tile extents"],
  ] as const) {
    const filePath = path.resolve(
      getFeatureTypeDirPath(featureType),
      `preview--${_.kebabCase(name)}.geojson`,
    );

    await writeFormattedJson(filePath, turf.featureCollection(features));
    logger.log(`${name} saved to ${chalk.magenta(filePath)}`);
  }
};
