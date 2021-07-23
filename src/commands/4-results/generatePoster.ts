import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import * as envalid from "envalid";
import path from "path";
import puppeteer from "puppeteer";

import { cleanEnv } from "../../shared/cleanEnv";
import { ensureLaunchedWebApp } from "../../shared/ensureLaunchedWebApp";
import {
  ensureImageSnapshot,
  ensurePdfSnapshot,
} from "../../shared/pageSnapshots";
import { extractPosterConfig } from "../../shared/poster";
import {
  ensureTerritoryGitignoreContainsResults,
  generateVersionSuffix,
  getResultsDirPath,
} from "../../shared/results";
import {
  getTerritoryConfig,
  getTerritoryExtent,
  getTerritoryId,
} from "../../shared/territory";

export const generatePoster: Command = async ({ logger }) => {
  const posterLayout = extractPosterConfig(
    await getTerritoryConfig(),
    await getTerritoryExtent(),
  ).layout;

  const { EXTENSION: extension } = cleanEnv({
    EXTENSION: envalid.str<"pdf" | "jpg" | "png">({
      choices: ["pdf", "jpg", "png"],
      default: "pdf",
    }),
  });

  await ensureTerritoryGitignoreContainsResults();

  const version = generateVersionSuffix();
  const territoryId = getTerritoryId();
  const resultFilePath = path.resolve(
    getResultsDirPath(),
    `${territoryId}.poster.${version}.${extension}`,
  );

  await ensureLaunchedWebApp({
    logger,
    action: async (webAppUrl) => {
      logger.log(chalk.green(`Making web page snapshot...`));
      const browser = await puppeteer.launch();

      const page = await browser.newPage();
      await page.goto(`${webAppUrl}/poster`);

      if (extension === "pdf") {
        await ensurePdfSnapshot({
          logger,
          page,
          pdfSizeInMillimeters: [
            posterLayout.widthInMillimeters +
              posterLayout.printerBleedInMillimeters * 2,
            posterLayout.heightInMillimeters +
              posterLayout.printerBleedInMillimeters * 2,
          ],
          resultFilePath,
        });
      } else {
        await ensureImageSnapshot({
          imageScaleFactor: 3,
          logger,
          page,
          quality: extension === "jpg" ? 85 : undefined,
          resultFilePath,
        });
      }

      await browser.close();
    },
  });
};

autoStartCommandIfNeeded(generatePoster, __filename);
