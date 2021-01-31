import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";

import { processFiles } from "../../../shared/processFiles";
import {
  getObjectInfoPagesDirPath,
  InfoPageData,
} from "../../../shared/sources/rosreestr";

export const generateInfoPages: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/rosreestr: Fetching object infos"));

  await processFiles({
    logger,
    fileSearchPattern: `**/page-*.json`,
    fileSearchDirPath: getObjectInfoPagesDirPath(),
    showFilePath: true,
    statusReportFrequency: 1,
    processFile: async (filePath) => {
      const infoPageData = (await fs.readJson(filePath)) as InfoPageData;
      process.stdout.write(" ".repeat(12));

      for (let index = 0; index < infoPageData.length; index += 1) {
        const objectInInfoPage = infoPageData[index]!;

        if (objectInInfoPage.creationReason === "gap") {
          process.stdout.write(chalk.gray("."));
          continue;
        }

        if (objectInInfoPage.creationReason === "lotInTile") {
          process.stdout.write(chalk.gray("l"));
          continue;
        }

        if (objectInInfoPage.creationReason === "ccoInTile") {
          process.stdout.write(chalk.bold("c"));
          continue;
        }
      }
      logger.log("");
    },
  });
};

autoStartCommandIfNeeded(generateInfoPages, __filename);
