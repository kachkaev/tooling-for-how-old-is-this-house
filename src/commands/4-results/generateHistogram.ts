import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import path from "path";
import puppeteer from "puppeteer";

import { ensureLaunchedWebApp } from "../../shared/ensureLaunchedWebApp";
import { ensureImageSnapshot } from "../../shared/pageSnapshots";
import {
  ensureTerritoryGitignoreContainsResults,
  generateVersionSuffix,
  getResultsDirPath,
} from "../../shared/results";
import { getTerritoryId } from "../../shared/territory";

export const generateHistogram: Command = async ({ logger }) => {
  logger.log(chalk.bold("results: Generating histogram"));

  const extension = "png";

  await ensureTerritoryGitignoreContainsResults();

  const version = generateVersionSuffix();
  const territoryId = getTerritoryId();
  const resultFilePath = path.resolve(
    getResultsDirPath(),
    `${territoryId}.histogram.${version}.${extension}`,
  );

  await ensureLaunchedWebApp({
    logger,
    action: async (webAppUrl) => {
      logger.log(chalk.green(`Making web page snapshot...`));
      const browser = await puppeteer.launch();

      const page = await browser.newPage();
      await page.goto(`${webAppUrl}/histogram`);

      await ensureImageSnapshot({
        imageScaleFactor: 2,
        logger,
        page,
        resultFilePath,
      });

      await browser.close();
    },
  });
};

autoStartCommandIfNeeded(generateHistogram, __filename);
