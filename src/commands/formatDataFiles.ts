import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";

import { formatJson } from "../shared/helpersForJson";
import { processFiles } from "../shared/processFiles";
import { getRegionDirPath } from "../shared/region";

export const formatDataFiles: Command = async ({ logger }) => {
  logger.log(chalk.bold("Formatting all data files"));

  await processFiles({
    logger,
    fileSearchPattern: "**/*.(json|geojson)",
    fileSearchDirPath: getRegionDirPath(),
    processFile: async (filePath) => {
      const originalJson = await fs.readFile(filePath, "utf8");
      const jsonData = JSON.parse(originalJson);
      const formattedJson = formatJson(jsonData, {
        checkIntegrity: true,
      });
      if (originalJson !== formattedJson) {
        await fs.writeFile(filePath, formattedJson, "utf8");
      }
    },
  });
};

autoStartCommandIfNeeded(formatDataFiles, __filename);
