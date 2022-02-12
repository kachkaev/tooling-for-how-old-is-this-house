import chalk from "chalk";
import path from "node:path";
import puppeteer from "puppeteer";

import { ensureLaunchedWebApp } from "../../shared/ensure-launched-web-app";
import { ensureImageSnapshot } from "../../shared/page-snapshots";
import {
  ensureTerritoryGitignoreContainsResults,
  generateVersionSuffix,
  getLocaleFromEnv,
  getResultsDirPath,
} from "../../shared/results";
import { getTerritoryId } from "../../shared/territory";

const output = process.stdout;

const script = async () => {
  output.write(
    chalk.bold("results: Generating geosemantica color legend demo\n"),
  );

  const extension = "png";

  await ensureTerritoryGitignoreContainsResults();

  const version = generateVersionSuffix();
  const territoryId = getTerritoryId();

  const locale = getLocaleFromEnv();

  await ensureLaunchedWebApp({
    output,
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

        output.write(
          chalk.green(`Making ${snapshot} snapshot (LOCALE=${locale})...\n`),
        );

        const page = await browser.newPage();
        await page.goto(
          `${webAppUrl}/${locale}/color-legend?snapshot=${snapshot}`,
        );

        await ensureImageSnapshot({
          imageScaleFactor: 2,
          output,
          omitBackground: true,
          page,
          resultFilePath,
        });
      }

      await browser.close();
    },
  });
};

await script();
