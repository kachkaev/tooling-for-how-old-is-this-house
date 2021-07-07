import chalk from "chalk";
import fs from "fs-extra";
import { DateTime } from "luxon";
import path from "path";
import puppeteer from "puppeteer";

import { getOutputDirPath } from "./outputMixing";

export const getImageDirPath = (): string =>
  path.resolve(getOutputDirPath(), "images");

export const generatePageUrl = (pathname: string): string =>
  `http://localhost:3000/${pathname}`;

const ensureImageSnapshot = async ({
  page,
  imageScaleFactor,
  imagePath,
  logger,
  quality,
}: {
  page: puppeteer.Page;
  imageScaleFactor: number;
  imagePath: string;
  logger: Console;
  quality?: number;
}): Promise<void> => {
  if (await fs.pathExists(imagePath)) {
    logger.log(chalk.gray(imagePath));

    return;
  }

  await page.setViewport({
    width: 100,
    height: 100,
    deviceScaleFactor: imageScaleFactor,
  });

  await page.screenshot({
    path: imagePath,
    quality,
    fullPage: true,
  });

  logger.log(chalk.magenta(imagePath));
};

const ensurePdfSnapshot = async ({
  page,
  pdfPath,
  logger,
  pdfSizeInMillimeters,
}: {
  page: puppeteer.Page;
  pdfPath: string;
  pdfSizeInMillimeters: [number, number];
  logger: Console;
}): Promise<void> => {
  if (await fs.pathExists(pdfPath)) {
    logger.log(chalk.gray(pdfPath));

    return;
  }

  await page.setViewport({
    width: 100,
    height: 100,
    deviceScaleFactor: 1,
  });

  await page.pdf({
    path: pdfPath,
    width: `${pdfSizeInMillimeters[0]}mm`,
    height: `${pdfSizeInMillimeters[1]}mm`,
    pageRanges: "1",
    printBackground: true,
  });

  logger.log(chalk.magenta(pdfPath));
};

export const makePageSnapshot = async ({
  imageScaleFactor = 1,
  imageExtension,
  imageJpegQuality = 85,
  logger,
  pagePath,
  pdfSizeInMillimeters,
}: {
  imageScaleFactor?: number;
  imageExtension?: string;
  imageJpegQuality?: number;
  logger: Console;
  pagePath: string;
  pdfSizeInMillimeters?: [number, number];
}) => {
  if (!imageExtension && !pdfSizeInMillimeters) {
    throw new Error("Expected imageExtension and/or pdfSizeInMillimeters");
  }

  const imageDirPath = getImageDirPath();

  await fs.ensureDir(imageDirPath);

  const resultVersion = `v${DateTime.now().toFormat("y-MM-dd-HHmmss")}`;

  const browser = await puppeteer.launch();

  const outputBasePath = path.resolve(
    imageDirPath,
    `${pagePath.replace(/(\/|\\)/g, "~")}.${resultVersion}`,
  );

  const page = await browser.newPage();
  await page.goto(generatePageUrl(pagePath));

  if (imageExtension) {
    await ensureImageSnapshot({
      page,
      imageScaleFactor,
      imagePath: `${outputBasePath}.${imageExtension}`,
      logger,
      quality: imageExtension === "jpg" ? imageJpegQuality : undefined,
    });
  }

  if (pdfSizeInMillimeters) {
    await ensurePdfSnapshot({
      page,
      pdfSizeInMillimeters,
      pdfPath: `${outputBasePath}.pdf`,
      logger,
    });
  }

  await page.close();
  await browser.close();

  logger.log(`Done!`);
};
