import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import sortKeys from "sort-keys";

import {
  AddressHandlingConfig,
  buildCleanedAddressAst,
} from "../../../shared/addresses";
import { extractSerializedTimeFromPrependedHtmlComment } from "../../../shared/helpers-for-html";
import {
  serializeTime,
  writeFormattedJson,
} from "../../../shared/helpers-for-json";
import { processFiles } from "../../../shared/process-files";
import {
  getWikimapiaObjectInfoFileSuffix,
  getWikimapiaObjectsDirPath,
  getWikimapiaRawObjectInfoFileSuffix,
  WikimapiaObjectInfo,
  WikimapiaObjectInfoFile,
  WikimapiaObjectPhotoInfo,
} from "../../../shared/sources/wikimapia";
import { getTerritoryAddressHandlingConfig } from "../../../shared/territory";

const cleanCompletionTimeMatch = (match?: string): string | undefined => {
  const result = (match ?? "")
    .toLowerCase()
    .replace(/(годах?|году|годов|гг)\.?/, "")
    .replace(/(\D)г/, "$1")
    .replace(/^(\d+)-х/, "$1-е") // “2010-е”, but “начало 2010-х”
    .replace(/-?го века/, "-й век")
    .replace(/начале/, "начало")
    .replace(/середине/, "середина")
    .replace(/конце/, "конец")
    .trim();

  return result && result.length < 20 ? result : undefined;
};

const extractCompletionTimeFromTags = (rawInfo: string): string | undefined => {
  const completionTimeMatch = rawInfo.match(
    /lng=1">строение ([^<]*)<\/strong>/,
  )?.[1];

  return cleanCompletionTimeMatch(completionTimeMatch);
};

const extractName = (
  rawInfo: string,
  addressHandlingConfig: AddressHandlingConfig,
) => {
  const result =
    rawInfo.match(
      /<meta property="og:title" {2}content="(.*) - Wikimapia"/,
    )?.[1] ?? "";

  if (!result) {
    return;
  }

  // Ignore trivial names referring to building address (e.g. “ул. Такая-то, 10”)
  const cleanedAddressAst = buildCleanedAddressAst(
    result,
    addressHandlingConfig,
  );

  if (
    !cleanedAddressAst.children.some(
      (node) => node.nodeType === "word" && node.wordType === "unclassified",
    )
  ) {
    return;
  }

  const indexOfDesignation = cleanedAddressAst.children.findIndex(
    (node) => node.nodeType === "word" && node.wordType === "designation",
  );
  const indexOfCardinalNumber = cleanedAddressAst.children.findIndex(
    (node) => node.nodeType === "word" && node.wordType === "cardinalNumber",
  );
  if (
    indexOfDesignation >= 0 &&
    indexOfCardinalNumber >= 0 &&
    indexOfCardinalNumber > indexOfDesignation
  ) {
    return;
  }

  return result;
};

const extractCompletionTimeFromDescription = (
  rawInfo: string,
): string | undefined => {
  const descriptionContentMatch =
    rawInfo.match(/<meta name="description" content="(.*)"/)?.[1] ?? "";

  const completionTimeMatch =
    descriptionContentMatch.match(/остроен.? в ([^,.]*)/)?.[1];

  return cleanCompletionTimeMatch(completionTimeMatch);
};

const script = async () => {
  const output = process.stdout;
  output.write(chalk.bold("sources/wikimapia: Parsing raw object infos\n"));

  const logOutputFileName = (
    outputFilePath: string,
    prefixLength: number,
    status: "alreadyUpToDate" | "modified",
  ) => {
    const color = status === "modified" ? chalk.magenta : chalk.gray;
    output.write(`${" ".repeat(prefixLength - 1)}↳ ${color(outputFilePath)}\n`);
  };

  const addressHandlingConfig = await getTerritoryAddressHandlingConfig(output);

  await processFiles({
    fileSearchPattern: `**/*--${getWikimapiaRawObjectInfoFileSuffix()}`,
    fileSearchDirPath: getWikimapiaObjectsDirPath(),
    filesNicknameToLog: "htmls with wikimapia objects",
    output,
    processFile: async (filePath, prefixLength) => {
      const outputFilePath = filePath.replace(
        `--${getWikimapiaRawObjectInfoFileSuffix()}`,
        `--${getWikimapiaObjectInfoFileSuffix()}`,
      );

      const wikimapiaIdInFilePath = Number.parseInt(
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

      // Extract photos
      const photoInfos: WikimapiaObjectPhotoInfo[] = [];
      const photoMatches = rawInfo.matchAll(
        /<div itemscope itemtype="http:\/\/schema.org\/ImageObject" style="display:inline">\n([^]*?)<\/div>/g,
      );
      for (const photoMatch of photoMatches) {
        const photoMatchContent = photoMatch[1]!;
        const userId = Number.parseInt(
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
          output.write(`${photoMatchContent}\n`);
          throw new Error(
            `Unexpected error parsing photo match ${JSON.stringify({
              userId,
              userName,
              url,
            })}. The script might need enhancing.`,
          );
        }

        photoInfos.push({
          url,
          userId,
          userName,
        });
      }

      if (photoInfos.length > 0) {
        info.photos = photoInfos;
      }

      // Extract completion time
      const completionTime =
        extractCompletionTimeFromTags(rawInfo) ??
        extractCompletionTimeFromDescription(rawInfo);
      if (completionTime) {
        info.completionTime = completionTime;
      }

      // Extract title
      const name = extractName(rawInfo, addressHandlingConfig);
      if (name) {
        info.name = name;
      }

      // Mark buildings are demolished
      // https://wikimapia.org/object/category/?type=view&id=45694
      if (rawInfo.includes('id="category-45694"')) {
        info.demolished = true;
      }

      const objectInfoFileJson: WikimapiaObjectInfoFile = {
        fetchedAt: extractSerializedTimeFromPrependedHtmlComment(rawInfo),
        parsedAt: serializeTime(),
        data: sortKeys(info, { deep: true }),
      };

      try {
        const existingObjectInfoFileJson = (await fs.readJson(
          outputFilePath,
        )) as WikimapiaObjectInfoFile;
        if (
          _.isEqual(
            _.omit(objectInfoFileJson.data, "parsedAt"),
            _.omit(existingObjectInfoFileJson.data, "parsedAt"),
          )
        ) {
          logOutputFileName(outputFilePath, prefixLength, "alreadyUpToDate");

          return;
        }
      } catch {
        // noop (file does not exist)
      }

      await writeFormattedJson(outputFilePath, objectInfoFileJson);
      logOutputFileName(outputFilePath, prefixLength, "modified");
    },
  });
};

await script();
