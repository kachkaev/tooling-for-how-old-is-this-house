import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";

import { summarizeTiles } from "../../../shared/sources/rosreestr";

export const summarizeTilesWithCcos: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/rosreestr: Summarizing tiles with CCOs"));

  await summarizeTiles({ featureType: "cco", logger });
};

autoStartCommandIfNeeded(summarizeTilesWithCcos, __filename);
