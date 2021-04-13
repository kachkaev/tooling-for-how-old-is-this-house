import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";

import { formatJson, getJsonFormattingStyle } from "../shared/helpersForJson";
import { processFiles } from "../shared/processFiles";
import { getTerritoryDirPath } from "../shared/territory";

export const formatDataFiles: Command = async ({ logger }) => {
  logger.log(chalk.bold("Formatting all data files"));

  await processFiles({
    logger,
    fileSearchPattern: "**/*.(json|geojson)",
    fileSearchDirPath: getTerritoryDirPath(),
    showFilePath: true,
    statusReportFrequency: 500,
    processFile: async (filePath) => {
      const originalJson = await fs.readFile(filePath, "utf8");
      const jsonData = JSON.parse(originalJson);
      const formattedJson = formatJson(jsonData, {
        checkIntegrity: true,
        formattingStyle: getJsonFormattingStyle(filePath),
      });
      if (originalJson !== formattedJson) {
        await fs.writeFile(filePath, formattedJson, "utf8");
      }
    },
  });
};

autoStartCommandIfNeeded(formatDataFiles, __filename);
