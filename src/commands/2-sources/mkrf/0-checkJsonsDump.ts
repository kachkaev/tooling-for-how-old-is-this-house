import {
  autoStartCommandIfNeeded,
  Command,
  CommandError,
} from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";

import { getMkrfJsonsDumpFilePath } from "../../../shared/sources/mkrf";

export const extractObjectsFromJsonsDump: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/mkrf: Check presence of the JSONS dump"));

  const jsonsDumpFilePath = getMkrfJsonsDumpFilePath();

  logger.log(`Location: ${chalk.cyan(jsonsDumpFilePath)}`);

  if (!(await fs.pathExists(jsonsDumpFilePath))) {
    throw new CommandError(`File does not exist.`);
  }

  if (!jsonsDumpFilePath.endsWith(".jsons")) {
    throw new CommandError(`Expected file extension extension to be ‘jsons’.`);
  }

  logger.log(`All good - file exists!`);
};

autoStartCommandIfNeeded(extractObjectsFromJsonsDump, __filename);
