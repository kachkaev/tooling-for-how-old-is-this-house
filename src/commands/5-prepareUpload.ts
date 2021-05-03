import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";

export const prepareUpload: Command = async ({ logger }) => {
  logger.log();
  logger.log(chalk.yellow("This command is has not been implemented yet."));
  logger.log();
};

autoStartCommandIfNeeded(prepareUpload, __filename);
