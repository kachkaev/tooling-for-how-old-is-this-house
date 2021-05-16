import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";
import sortKeys from "sort-keys";

import { extractSerializedTimeFromPrependedHtmlComment } from "../../../shared/helpersForHtml";
import {
  serializeTime,
  writeFormattedJson,
} from "../../../shared/helpersForJson";
import { processFiles } from "../../../shared/processFiles";
import {
  getWikimapiaObjectInfoFileSuffix,
  getWikimapiaObjectsDir,
  getWikimapiaRawObjectInfoFileSuffix,
  WikimapiaObjectInfo,
  WikimapiaObjectInfoFile,
  WikimapiaObjectPhotoInfo,
} from "../../../shared/sources/wikimapia";

export const parseRawObjectInfos: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/wikimapia: Parsing raw object infos"));

  const logOutputFileName = (
    outputFilePath: string,
    prefixLength: number,
    status: "alreadyUpToDate" | "modified",
  ) => {
    const color = status === "modified" ? chalk.magenta : chalk.gray;
    logger.log(`${" ".repeat(prefixLength - 1)}↳ ${color(outputFilePath)}`);
  };

  await processFiles({
    logger,
    fileSearchPattern: `**/*--${getWikimapiaRawObjectInfoFileSuffix()}`,
    fileSearchDirPath: getWikimapiaObjectsDir(),
    filesNicknameToLog: "htmls with wikimapia objects",
    processFile: async (filePath, prefixLength) => {
      const outputFilePath = filePath.replace(
        `--${getWikimapiaRawObjectInfoFileSuffix()}`,
        `--${getWikimapiaObjectInfoFileSuffix()}`,
      );

      if (await fs.pathExists(outputFilePath)) {
        logOutputFileName(outputFilePath, prefixLength, "alreadyUpToDate");

        return;
      }

      const wikimapiaIdInFilePath = parseInt(
        filePath.match(/(\d+)--/)?.[1] ?? "0",
      );
      if (!wikimapiaIdInFilePath) {
        throw new Error(
          `Unexpected failure in extracting wikimapia id from file path`,
        );
      }

      const rawInfo = await fs.readFile(filePath, "utf8");
      const info: WikimapiaObjectInfo = {
        wikimapiaId: wikimapiaIdInFilePath,
      };

      // extract photos
      const photoInfos: WikimapiaObjectPhotoInfo[] = [];
      const photoMatches = rawInfo.matchAll(
        /<div itemscope itemtype="http:\/\/schema.org\/ImageObject" style="display:inline">\n([^]*?)<\/div>/g,
      );
      for (const photoMatch of [...photoMatches]) {
        const photoMatchContent = photoMatch[1]!;
        const userId = parseInt(
          photoMatchContent.match(/data-user-id="(.+?)"/)?.[1] ?? "0",
        );
        const userName =
          photoMatchContent.match(/data-user-name="(.+?)"/)?.[1] ?? "";
        const url =
          photoMatchContent.match(/href="(https?:\/\/.+?)"/)?.[1] ?? "";

        if (
          !url ||
          ((!userId || !userName) && !(userName === "Guest" && userId === 0))
        ) {
          logger.log(photoMatchContent);
          throw new Error(
            `Unexpected error parsing photo match ${JSON.stringify({
              userId,
              userName,
              url,
            })}. The script might need enhancing`,
          );
        }

        photoInfos.push({
          url,
          userId,
          userName,
        });
      }

      if (photoInfos.length) {
        info.photos = photoInfos;
      }

      const objectInfoFileJson: WikimapiaObjectInfoFile = {
        fetchedAt: extractSerializedTimeFromPrependedHtmlComment(rawInfo),
        parsedAt: serializeTime(),
        data: sortKeys(info, { deep: true }),
      };

      await writeFormattedJson(outputFilePath, objectInfoFileJson);
      logOutputFileName(outputFilePath, prefixLength, "modified");
    },
  });
};

autoStartCommandIfNeeded(parseRawObjectInfos, __filename);
