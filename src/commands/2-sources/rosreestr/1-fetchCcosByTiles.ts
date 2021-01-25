import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";

import { getRegionExtent } from "../../../shared/region";
import { generateProcessTile } from "../../../shared/sources/rosreestr";
import { processTiles } from "../../../shared/tiles";

export const fetchLotsByTiles: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/rosreestr: Fetching CCOs by tiles"));

  await processTiles({
    initialZoom: 13,
    maxAllowedZoom: 20,
    regionExtent: await getRegionExtent(),
    processTile: generateProcessTile("cco"),
    logger,
  });
};

autoStartCommandIfNeeded(fetchLotsByTiles, __filename);
