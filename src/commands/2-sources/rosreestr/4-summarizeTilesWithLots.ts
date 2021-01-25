import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";

import { summarizeTiles } from "../../../shared/sources/rosreestr";

export const summarizeTilesWithLots: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/rosreestr: Summarizing tiles with lots"));

  await summarizeTiles({ featureType: "cco", logger });
};

autoStartCommandIfNeeded(summarizeTilesWithLots, __filename);
