import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";

import { cleanEnv } from "../shared/cleanEnv";

export const probe: Command = async ({ logger }) => {
  cleanEnv({});
  logger.log(chalk.green("Ready!"));
};

autoStartCommandIfNeeded(probe, __filename);
