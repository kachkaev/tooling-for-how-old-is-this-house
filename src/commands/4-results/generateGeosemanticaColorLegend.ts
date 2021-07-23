import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import puppeteer from "puppeteer";

import { ensureLaunchedWebApp } from "../../shared/ensureLaunchedWebApp";
import {
  ensureTerritoryGitignoreContainsResults,
  generateVersionSuffix,
  getResultsDirPath,
} from "../../shared/results";
import { getTerritoryId } from "../../shared/territory";

export const generateGeosemanticaColorLegend: Command = async ({ logger }) => {
  logger.log(chalk.bold("results: Generating Geosemantica color legend"));

  await ensureTerritoryGitignoreContainsResults();

  const version = generateVersionSuffix();
  const territoryId = getTerritoryId();
  const resultFilePath = path.resolve(
    getResultsDirPath(),
    `${territoryId}.color-legend.${version}.svg`,
  );

  await ensureLaunchedWebApp({
    logger,
    action: async (webAppUrl) => {
      logger.log(chalk.green(`Crawling web page...`));
      const browser = await puppeteer.launch();

      const page = await browser.newPage();
      await page.goto(`${webAppUrl}/color-legend`);

      const svgContainerSelector = "[data-testid=svgContainer]";
      await page.waitForSelector(svgContainerSelector);
      const svgHtml = await page.$eval(
        svgContainerSelector,
        (element) => element.innerHTML,
      );

      await fs.writeFile(resultFilePath, svgHtml, "utf8");

      logger.log(chalk.magenta(resultFilePath));

      await browser.close();
    },
  });
};

autoStartCommandIfNeeded(generateGeosemanticaColorLegend, __filename);
