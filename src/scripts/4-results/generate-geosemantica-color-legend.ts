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

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("results: Generating Geosemantica color legend\n"));

  await ensureTerritoryGitignoreContainsResults();

  const version = generateVersionSuffix();
  const territoryId = getTerritoryId();
  const resultFilePath = path.resolve(
    getResultsDirPath(),
    `${territoryId}.color-legend.${version}.svg`,
  );

  await ensureLaunchedWebApp({
    output,
    action: async (webAppUrl) => {
      output.write(chalk.green("Crawling web page...\n"));
      const browser = await puppeteer.launch();

      const page = await browser.newPage();
      await page.goto(`${webAppUrl}/color-legend`);

      const svgContainerSelector = "[data-testid=svgContainer]";
      await page.waitForSelector(svgContainerSelector);
      const svgHtml = await page.$eval(
        svgContainerSelector,
        (element) => element.innerHTML,
      );

      await fs.ensureDir(getResultsDirPath());
      await fs.writeFile(resultFilePath, svgHtml, "utf8");

      output.write(chalk.magenta(resultFilePath));

      await browser.close();
    },
  });
};

await script();
