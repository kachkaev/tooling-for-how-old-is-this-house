import chalk from "chalk";
import fs from "fs-extra";
import path from "node:path";
import { WriteStream } from "node:tty";
import puppeteer from "puppeteer";

const nextJsPageSelector = "#__next *";

export const ensureImageSnapshot = async ({
  imageScaleFactor,
  omitBackground = false,
  output,
  page,
  quality = 100,
  resultFilePath,
  selectorToWaitFor = nextJsPageSelector,
}: {
  imageScaleFactor: number;
  omitBackground?: boolean;
  output: WriteStream;
  page: puppeteer.Page;
  quality?: number | undefined;
  resultFilePath: string;
  selectorToWaitFor?: string;
}): Promise<void> => {
  if (await fs.pathExists(resultFilePath)) {
    output.write(`${chalk.gray(resultFilePath)}\n`);

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

  output.write(`${chalk.magenta(resultFilePath)}\n`);
};

export const ensurePdfSnapshot = async ({
  output,
  page,
  pdfSizeInMillimeters,
  resultFilePath,
  selectorToWaitFor = nextJsPageSelector,
}: {
  output: WriteStream;
  page: puppeteer.Page;
  pdfSizeInMillimeters: [number, number];
  resultFilePath: string;
  selectorToWaitFor?: string;
}): Promise<void> => {
  if (await fs.pathExists(resultFilePath)) {
    output.write(`${chalk.gray(resultFilePath)}\n`);

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

  output.write(`${chalk.magenta(resultFilePath)}\n`);
};
