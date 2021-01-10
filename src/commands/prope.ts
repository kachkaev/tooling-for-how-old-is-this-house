import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";

export const probe: Command = async ({ logger }) => {
  logger.log(chalk.green("Ready."));
};

autoStartCommandIfNeeded(probe, __filename);
