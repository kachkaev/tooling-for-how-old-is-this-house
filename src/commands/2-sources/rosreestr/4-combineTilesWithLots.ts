import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";

import { combineTiles } from "../../../shared/sources/rosreestr";

export const combineTilesWithLots: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/rosreestr: Combining tiles with lots"));

  await combineTiles({ featureType: "cco", logger });
};

autoStartCommandIfNeeded(combineTilesWithLots, __filename);
