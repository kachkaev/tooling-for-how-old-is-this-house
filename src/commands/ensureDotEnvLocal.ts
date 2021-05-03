import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

export const ensureDotEnvLocal: Command = async ({ logger }) => {
  const filePath = path.resolve(".env.local");
  if (await fs.pathExists(filePath)) {
    logger.log(`File already exists: ${chalk.gray(`${filePath}`)} `);

    return;
  }

  process.stdout.write(`Creating ${chalk.magenta(`${filePath}`)}...`);
  await fs.ensureFile(filePath);
  logger.log(` Done.`);
};

autoStartCommandIfNeeded(ensureDotEnvLocal, __filename);
