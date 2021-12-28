import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";

import { listFilePaths } from "../../../shared/listFilePaths";
import {
  ensureRosreestrInfoPage,
  FirResponseInInfoPageResponse,
  getObjectInfoPageFilePath,
  getObjectInfoPagesDirPath,
  InfoPageData,
  PkkResponseInInfoPageResponse,
  rosreestrObjectInfoPageTailLength,
} from "../../../shared/sources/rosreestr";

const responseHasObject = (
  response:
    | FirResponseInInfoPageResponse
    | PkkResponseInInfoPageResponse
    | undefined,
) => {
  return response && response !== "void";
};

const command: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/rosreestr: Adding extra object info pages"));

  const infoPagePaths = await listFilePaths({
    logger,
    fileSearchPattern: "**/page-*.json",
    fileSearchDirPath: getObjectInfoPagesDirPath(),
    filesNicknameToLog: "rosreestr info pages",
  });

  process.stdout.write(chalk.green("Indexing..."));

  const maxPageByBlockCn: Record<string, number> = {};

  for (const infoPagePath of infoPagePaths) {
    const [fileName, dirSegment3, dirSegment2, dirSegment1] = infoPagePath
      .replace(/\\/g, "/")
      .split("/")
      .reverse();

    const pageNumber = parseInt(fileName?.split("-")[1] ?? "0");
    const blockCn = `${dirSegment1}:${dirSegment2}:${dirSegment3}`;
    const existingPageNumber = maxPageByBlockCn[blockCn];
    if (
      typeof existingPageNumber !== "number" ||
      existingPageNumber < pageNumber
    ) {
      maxPageByBlockCn[blockCn] = pageNumber;
    }
  }
  const blockCns = _.orderBy(Object.keys(maxPageByBlockCn));

  process.stdout.write(` Done. Number of blocks: ${blockCns.length}.\n`);

  process.stdout.write(chalk.green("Scanning last page in each block..."));
  const pagesToCreate: Array<{ blockCn: string; pageNumber: number }> = [];

  for (const blockCn of blockCns) {
    const maxPageNumber = maxPageByBlockCn[blockCn];
    if (typeof maxPageNumber !== "number") {
      throw new Error(
        `Unexpected empty max page number for block ${blockCn}. This is a bug, please report it.`,
      );
    }

    const pagePath = getObjectInfoPageFilePath(blockCn, maxPageNumber);
    const infoPageData = (await fs.readJson(pagePath)) as InfoPageData;
    const infoPageObjectsInPageTail = infoPageData.slice(
      infoPageData.length - rosreestrObjectInfoPageTailLength,
    );

    const needToAddPage = infoPageObjectsInPageTail.some(
      (infoPageObject) =>
        responseHasObject(infoPageObject.firResponse) ||
        responseHasObject(infoPageObject.pkkResponse) ||
        infoPageObject.creationReason === "lotInTile",
    );

    if (!needToAddPage) {
      continue;
    }

    const tailIsFullOfFlats = infoPageObjectsInPageTail.every(
      (infoPageObject) => infoPageObject.firResponse === "flat",
    );

    const numberOfPagesToAdd = tailIsFullOfFlats ? 5 : 3;

    for (let i = 1; i <= numberOfPagesToAdd; i += 1) {
      pagesToCreate.push({
        blockCn,
        pageNumber: maxPageNumber + i,
      });
    }
  }

  process.stdout.write(
    ` Done. Number of extra pages to create: ${pagesToCreate.length}.\n`,
  );

  if (!pagesToCreate.length) {
    return;
  }

  logger.log(chalk.green("Creating pages..."));

  for (const pageToCreate of pagesToCreate) {
    const pagePath = getObjectInfoPageFilePath(
      pageToCreate.blockCn,
      pageToCreate.pageNumber,
    );

    const pageWasWritten = await ensureRosreestrInfoPage(pageToCreate);
    logger.log((pageWasWritten ? chalk.magenta : chalk.gray)(pagePath));
  }

  logger.log(`Done. Number of extra pages created: ${pagesToCreate.length}.`);
};

autoStartCommandIfNeeded(command, __filename);

export default command;
