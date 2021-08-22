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
  logger.log(chalk.bold("results: Generating geosemantica color legend demo"));

  const extension = "png";

  await ensureTerritoryGitignoreContainsResults();

  const version = generateVersionSuffix();
  const territoryId = getTerritoryId();

  const locale = getLocaleFromEnv();

  await ensureLaunchedWebApp({
    logger,
    action: async (webAppUrl) => {
      const browser = await puppeteer.launch();

      for (const snapshot of ["main", "color-blindness"]) {
        if (snapshot === "main" && locale !== "ru") {
          // Assuming no locale-dependent content in the main snapshot
          continue;
        }

        const resultFilePath = path.resolve(
          getResultsDirPath(),
          `${territoryId}.color-legend-demo.${version}.${snapshot}${
            locale === "ru" ? "" : `.${locale}`
          }.${extension}`,
        );

        logger.log(
          chalk.green(`Making ${snapshot} snapshot (LOCALE=${locale})...`),
        );

        const page = await browser.newPage();
        await page.goto(
          `${webAppUrl}/${locale}/color-legend?snapshot=${snapshot}`,
        );

        await ensureImageSnapshot({
          imageScaleFactor: 2,
          logger,
          omitBackground: true,
          page,
          resultFilePath,
        });
      }

      await browser.close();
    },
  });
};

autoStartCommandIfNeeded(generateHistogram, __filename);
