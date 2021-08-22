import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import path from "path";
import puppeteer from "puppeteer";

import { ensureLaunchedWebApp } from "../../shared/ensureLaunchedWebApp";
import { ensureImageSnapshot } from "../../shared/pageSnapshots";
import {
  ensureTerritoryGitignoreContainsResults,
  generateVersionSuffix,
  getLocaleFromEnv,
  getResultsDirPath,
} from "../../shared/results";
import { getTerritoryId } from "../../shared/territory";

export const generateHistogram: Command = async ({ logger }) => {
  logger.log(chalk.bold("results: Generating histogram"));

  const extension = "png";

  await ensureTerritoryGitignoreContainsResults();

  const version = generateVersionSuffix();
  const territoryId = getTerritoryId();

  const locale = getLocaleFromEnv();

  await ensureLaunchedWebApp({
    logger,
    action: async (webAppUrl) => {
      const browser = await puppeteer.launch();

      const resultFilePath = path.resolve(
        getResultsDirPath(),
        `${territoryId}.histogram.${version}${
          locale === "ru" ? "" : `.${locale}`
        }.${extension}`,
      );

      logger.log(chalk.green(`Making web page snapshot (LOCALE=${locale})...`));

      const page = await browser.newPage();
      await page.goto(`${webAppUrl}/${locale}/histogram`);

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
