import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";

import { writeFormattedJson } from "../shared/helpersForJson";
import { processFiles } from "../shared/processFiles";
import { getRegionDirPath } from "../shared/region";

export const formatDataFiles: Command = async ({ logger }) => {
  logger.log(chalk.bold("Formatting all data files"));

  await processFiles({
    logger,
    fileSearchPattern: "**/*.(json|geojson)",
    fileSearchDirPath: getRegionDirPath(),
    processFile: async (filePath) => {
      const originalJson = await fs.readJson(filePath);
      await writeFormattedJson(filePath, originalJson, {
        checkIntegrity: true,
      });
    },
  });
};

autoStartCommandIfNeeded(formatDataFiles, __filename);
