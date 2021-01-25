import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";

import { getRegionExtent } from "../../../shared/region";
import { generateProcessTile } from "../../../shared/sources/rosreestr";
import { processTiles } from "../../../shared/tiles";

export const fetchTilesWithLots: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/rosreestr: Fetching tiles with lots"));

  await processTiles({
    initialZoom: 13,
    maxAllowedZoom: 24,
    regionExtent: await getRegionExtent(),
    processTile: generateProcessTile("lot"),
    logger,
  });
};

autoStartCommandIfNeeded(fetchTilesWithLots, __filename);
