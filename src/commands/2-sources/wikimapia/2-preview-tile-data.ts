import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import _ from "lodash";
import path from "path";

import { ensureTerritoryGitignoreContainsPreview } from "../../../shared/helpersForCommands";
import { writeFormattedJson } from "../../../shared/helpersForJson";
import { getWikimapiaDirPath } from "../../../shared/sources/wikimapia";
import { combineWikimapiaTiles } from "../../../shared/sources/wikimapia/combineWikimapiaTiles";

const command: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/wikimapia: Previewing tile data"));

  const { objectPointFeatures, objectExtentFeatures, tileExtentFeatures } =
    await combineWikimapiaTiles({ logger });

  logger.log(chalk.green("Saving..."));

  await ensureTerritoryGitignoreContainsPreview();

  for (const [features, name] of [
    [objectPointFeatures, "Object points"],
    [objectExtentFeatures, "Object extents"],
    [tileExtentFeatures, "Tile extents"],
  ] as const) {
    const filePath = path.resolve(
      getWikimapiaDirPath(),
      `preview--${_.kebabCase(name)}.geojson`,
    );

    await writeFormattedJson(
      filePath,
      turf.featureCollection<turf.Polygon | turf.Point>(features),
    );
    logger.log(`${name} saved to ${chalk.magenta(filePath)}`);
  }
};

autoStartCommandIfNeeded(command, __filename);

export default command;
