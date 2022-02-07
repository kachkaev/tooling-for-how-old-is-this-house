import chalk from "chalk";
import envalid from "envalid";
import path from "node:path";
import puppeteer from "puppeteer";

import { cleanEnv } from "../../shared/cleanEnv";
import { ensureLaunchedWebApp } from "../../shared/ensureLaunchedWebApp";
import {
  ensureImageSnapshot,
  ensurePdfSnapshot,
} from "../../shared/pageSnapshots";
import {
  extractPosterConfig,
  extractPrinterBleedInMillimeters,
} from "../../shared/poster";
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

const output = process.stdout;

const script = async () => {
  const posterConfig = extractPosterConfig(
    await getTerritoryConfig(),
    await getTerritoryExtent(),
  );

  const { EXTENSION: extension } = cleanEnv({
    EXTENSION: envalid.str({
      choices: ["pdf", "jpg", "png"] as const,
      default: "pdf",
    }),
  });

  await ensureTerritoryGitignoreContainsResults();

  const version = generateVersionSuffix();
  const territoryId = getTerritoryId();
  const resultFilePath = path.resolve(
    getResultsDirPath(),
    `${territoryId}.poster.${version}.${posterConfig.target}.${extension}`,
  );

  await ensureLaunchedWebApp({
    output,
    action: async (webAppUrl) => {
      output.write(chalk.green(`Making web page snapshot...\n`));
      const browser = await puppeteer.launch();

      const page = await browser.newPage();
      await page.goto(`${webAppUrl}/poster`);

      await (extension === "pdf"
        ? ensurePdfSnapshot({
            output,
            page,
            pdfSizeInMillimeters: [
              posterConfig.layout.widthInMillimeters +
                extractPrinterBleedInMillimeters(posterConfig) * 2,
              posterConfig.layout.heightInMillimeters +
                extractPrinterBleedInMillimeters(posterConfig) * 2,
            ],
            resultFilePath,
          })
        : ensureImageSnapshot({
            imageScaleFactor: 3,
            output,
            page,
            quality: extension === "jpg" ? 85 : undefined,
            resultFilePath,
          }));

      await browser.close();
    },
  });
};

await script();
