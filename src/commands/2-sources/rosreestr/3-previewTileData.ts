import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";

import { combineRosreestrTilesAndSavePreviews } from "../../../shared/sources/rosreestr";

export const combineTilesWithCcos: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/rosreestr: Previewing tile data / CCOs"));
  await combineRosreestrTilesAndSavePreviews({ objectType: "cco", logger });

  logger.log(chalk.bold("sources/rosreestr: Previewing tile data / lots"));
  await combineRosreestrTilesAndSavePreviews({ objectType: "lot", logger });
};

autoStartCommandIfNeeded(combineTilesWithCcos, __filename);
