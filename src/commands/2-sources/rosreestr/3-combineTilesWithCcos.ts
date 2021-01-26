import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";

import { combineTiles } from "../../../shared/sources/rosreestr";

export const combineTilesWithCcos: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/rosreestr: Combining tiles with CCOs"));

  await combineTiles({ featureType: "cco", logger });
};

autoStartCommandIfNeeded(combineTilesWithCcos, __filename);
