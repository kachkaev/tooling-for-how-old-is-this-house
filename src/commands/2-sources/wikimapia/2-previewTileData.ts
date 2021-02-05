import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import _ from "lodash";
import path from "path";

import { writeFormattedJson } from "../../../shared/helpersForJson";
import { getWikimapiaDirPath } from "../../../shared/sources/wikimapia";
import { combineWikimapiaTiles } from "../../../shared/sources/wikimapia/combineWikimapiaTiles";

export const previewTileData: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/wikimapia: Previewing tile data"));

  const {
    objectPointFeatures,
    objectExtentFeatures,
    tileExtentFeatures,
  } = await combineWikimapiaTiles({ logger });

  logger.log(chalk.green("Saving..."));

  for (const [features, name] of [
    [objectPointFeatures, "Object points"],
    [objectExtentFeatures, "Object extents"],
    [tileExtentFeatures, "Tile extents"],
  ] as const) {
    const filePath = path.resolve(
      getWikimapiaDirPath(),
      `preview--${_.kebabCase(name)}.geojson`,
    );

    await writeFormattedJson(filePath, turf.featureCollection(features));
    logger.log(`${name} saved to ${chalk.magenta(filePath)}`);
  }
};

autoStartCommandIfNeeded(previewTileData, __filename);
