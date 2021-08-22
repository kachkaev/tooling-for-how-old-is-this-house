import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import puppeteer from "puppeteer";

const nextJsPageSelector = "#__next *";

export const ensureImageSnapshot = async ({
  imageScaleFactor,
  logger,
  omitBackground,
  page,
  quality,
  resultFilePath,
  selectorToWaitFor = nextJsPageSelector,
}: {
  imageScaleFactor: number;
  logger: Console;
  omitBackground?: boolean;
  page: puppeteer.Page;
  quality?: number;
  resultFilePath: string;
  selectorToWaitFor?: string;
}): Promise<void> => {
  if (await fs.pathExists(resultFilePath)) {
    logger.log(chalk.gray(resultFilePath));

    return;
  }

  await page.setViewport({
    width: 50,
    height: 50,
    deviceScaleFactor: imageScaleFactor,
  });

  await page.waitForSelector(selectorToWaitFor);

  await fs.ensureDir(path.dirname(resultFilePath));

  // Inspired by https://stackoverflow.com/a/55107065/1818285
  if (omitBackground) {
    await page.evaluate(() => {
      document.body.style.background = "transparent";
    });
  }

  await page.screenshot({
    path: resultFilePath,
    quality,
    fullPage: true,
    omitBackground,
  });

  logger.log(chalk.magenta(resultFilePath));
};

export const ensurePdfSnapshot = async ({
  logger,
  page,
  pdfSizeInMillimeters,
  resultFilePath,
  selectorToWaitFor = nextJsPageSelector,
}: {
  logger: Console;
  page: puppeteer.Page;
  pdfSizeInMillimeters: [number, number];
  resultFilePath: string;
  selectorToWaitFor?: string;
}): Promise<void> => {
  if (await fs.pathExists(resultFilePath)) {
    logger.log(chalk.gray(resultFilePath));

    return;
  }

  await page.setViewport({
    width: 50,
    height: 50,
    deviceScaleFactor: 1,
  });

  await page.waitForSelector(selectorToWaitFor);

  await fs.ensureDir(path.dirname(resultFilePath));

  await page.pdf({
    path: resultFilePath,
    width: `${pdfSizeInMillimeters[0]}mm`,
    height: `${pdfSizeInMillimeters[1]}mm`,
    pageRanges: "1",
    printBackground: true,
  });

  logger.log(chalk.magenta(resultFilePath));
};
