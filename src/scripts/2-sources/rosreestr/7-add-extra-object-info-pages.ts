import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";

import { listFilePaths } from "../../../shared/list-file-paths";
import {
  ensureRosreestrInfoPage,
  FirResponseInInfoPageResponse,
  getObjectInfoPageFilePath,
  getObjectInfoPagesDirPath,
  InfoPageData,
  PkkResponseInInfoPageResponse,
  rosreestrObjectInfoPageTailLength,
} from "../../../shared/source-rosreestr";

const output = process.stdout;

const responseHasObject = (
  response:
    | FirResponseInInfoPageResponse
    | PkkResponseInInfoPageResponse
    | undefined,
) => {
  return response && response !== "void";
};

const script = async () => {
  output.write(
    chalk.bold("sources/rosreestr: Adding extra object info pages\n"),
  );

  const infoPagePaths = await listFilePaths({
    output,
    fileSearchPattern: "**/page-*.json",
    fileSearchDirPath: getObjectInfoPagesDirPath(),
    filesNicknameToLog: "rosreestr info pages",
  });

  output.write(chalk.green("Indexing..."));

  const maxPageByBlockCn: Record<string, number> = {};

  for (const infoPagePath of infoPagePaths) {
    const [fileName, dirSegment3, dirSegment2, dirSegment1] = infoPagePath
      .replace(/\\/g, "/")
      .split("/")
      .reverse();

    const pageNumber = Number.parseInt(fileName?.split("-")[1] ?? "0");
    const blockCn = `${dirSegment1!}:${dirSegment2!}:${dirSegment3!}`;
    const existingPageNumber = maxPageByBlockCn[blockCn];
    if (
      typeof existingPageNumber !== "number" ||
      existingPageNumber < pageNumber
    ) {
      maxPageByBlockCn[blockCn] = pageNumber;
    }
  }
  const blockCns = _.orderBy(Object.keys(maxPageByBlockCn));

  output.write(` Done. Number of blocks: ${blockCns.length}.\n`);

  output.write(chalk.green("Scanning last page in each block..."));
  const pagesToCreate: Array<{ blockCn: string; pageNumber: number }> = [];

  for (const blockCn of blockCns) {
    const maxPageNumber = maxPageByBlockCn[blockCn];
    if (typeof maxPageNumber !== "number") {
      throw new TypeError(
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

    for (let index = 1; index <= numberOfPagesToAdd; index += 1) {
      pagesToCreate.push({
        blockCn,
        pageNumber: maxPageNumber + index,
      });
    }
  }

  output.write(
    ` Done. Number of extra pages to create: ${pagesToCreate.length}.\n`,
  );

  if (pagesToCreate.length === 0) {
    return;
  }

  output.write(chalk.green("Creating pages...\n"));

  for (const pageToCreate of pagesToCreate) {
    const pagePath = getObjectInfoPageFilePath(
      pageToCreate.blockCn,
      pageToCreate.pageNumber,
    );

    const pageWasWritten = await ensureRosreestrInfoPage(pageToCreate);
    output.write(
      `${(pageWasWritten ? chalk.magenta : chalk.gray)(pagePath)}\n`,
    );
  }

  output.write(
    `Done. Number of extra pages created: ${pagesToCreate.length}.\n`,
  );
};

await script();
