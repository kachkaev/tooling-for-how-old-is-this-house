import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import { AxiosResponse } from "axios";
import chalk from "chalk";
import fs from "fs-extra";
import sortKeys from "sort-keys";

import {
  getSerialisedNow,
  writeFormattedJson,
} from "../../../shared/helpersForJson";
import { processFiles } from "../../../shared/processFiles";
import {
  getObjectInfoPagesDirPath,
  InfoPageData,
  ResponseInInfoPageResponse,
  SuccessfulFirObjectResponse,
  SuccessfulResponseInInfoPage,
} from "../../../shared/sources/rosreestr";
import { fetchJsonFromRosreestr } from "../../../shared/sources/rosreestr/fetchJsonFromRosreestr";
import { convertCnToId } from "../../../shared/sources/rosreestr/helpersForCn";

/**
 * Recursively removes null and undefined values from an object
 * https://stackoverflow.com/a/54707141/1818285
 * TODO: consider refactoring
 */
const deepClean = <T>(obj: T): T =>
  JSON.parse(
    JSON.stringify(obj, (k, v) =>
      v === null || v === undefined ? undefined : v,
    ),
  );

const assertNoUsefulData = (responseData: SuccessfulResponseInInfoPage) => {
  if (responseData.parcelData?.oksYearBuilt) {
    throw new Error(
      `Did not expect to see oksYearBuilt in the flat ${responseData.objectId}. Maybe the script should be tweaked to harvest more data?`,
    );
  }
};

const processRawApiResponse = (
  rawApiResponse: AxiosResponse<unknown>,
): ResponseInInfoPageResponse => {
  if (rawApiResponse.status === 204) {
    return "not-found";
  } else if (rawApiResponse.status !== 200) {
    throw new Error(`Unexpected response status ${rawApiResponse.status}`);
  }

  const rawResponseData = rawApiResponse.data as SuccessfulFirObjectResponse;
  const responseData = Object.fromEntries(
    Object.entries(rawResponseData).filter(([key]) => key !== "oldNumbers"),
  ) as SuccessfulResponseInInfoPage;

  if (responseData.parcelData.oksType === "flat") {
    assertNoUsefulData(responseData);

    return "flat";
  } else if (!responseData.parcelData?.oksFlag) {
    assertNoUsefulData(responseData);

    return "lot";
  }

  return sortKeys(deepClean(responseData), { deep: true });
};

export const fetchObjectInfos: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/rosreestr: Fetching object infos"));

  const scriptStartTime = new Date();
  await processFiles({
    logger,
    fileSearchPattern: `**/page-*.json`,
    fileSearchDirPath: getObjectInfoPagesDirPath(),
    showFilePath: true,
    statusReportFrequency: 1,
    processFile: async (filePath, prefixLength) => {
      const fileStat = await fs.stat(filePath);
      if (fileStat.mtime > scriptStartTime) {
        logger.log(
          chalk.yellow(
            `${" ".repeat(
              prefixLength,
            )}Skipping – this file is being handled by another instance of the script`,
          ),
        );

        return;
      }

      // Lock the page by updating mtime to prevent concurrent processing
      await fs.utimes(filePath, fileStat.atime, new Date());

      const infoPageData = (await fs.readJson(filePath)) as InfoPageData;
      process.stdout.write(" ".repeat(prefixLength));

      const indexesInRange = new Set<number>();
      const gapFetchRange = 100; // Set to 0 to not fetch gaps around known CNs
      for (let index = -1; index <= infoPageData.length; index += 1) {
        const shouldTreatAsAnchor =
          index === -1 ||
          index === infoPageData.length ||
          infoPageData[index]?.creationReason !== "gap";

        if (!shouldTreatAsAnchor) {
          continue;
        }

        for (
          let index2 = Math.max(0, index - gapFetchRange);
          index2 <= Math.min(infoPageData.length - 1, index + gapFetchRange);
          index2 += 1
        ) {
          const canInclude =
            infoPageData[index2]?.creationReason !== "lotInTile";
          if (canInclude) {
            indexesInRange.add(index2);
          }
        }
      }

      for (let index = 0; index < infoPageData.length; index += 1) {
        const originalObject = infoPageData[index]!;

        if (indexesInRange.has(index) && !originalObject.fetchedAt) {
          const rawApiResponse = await fetchJsonFromRosreestr(
            `https://rosreestr.gov.ru/api/online/fir_object/${convertCnToId(
              originalObject.cn,
            )}`,
          );

          infoPageData[index] = {
            ...originalObject,
            fetchedAt: getSerialisedNow(),
            response: processRawApiResponse(rawApiResponse),
          };

          await writeFormattedJson(filePath, infoPageData);
        }

        const object = infoPageData[index]!;

        let progressSymbol = "?";

        if (
          object.creationReason === "lotInTile" ||
          object.response === "lot"
        ) {
          progressSymbol = "l";
        } else if (object.response === "flat") {
          progressSymbol = "f";
        } else if (object.response === "not-found") {
          progressSymbol = "•";
        } else if (typeof object.response === "object") {
          progressSymbol = object.response.parcelData?.oksType?.[0] ?? "?";
        }

        if (object.creationReason !== "gap") {
          progressSymbol = progressSymbol.toUpperCase();
        }

        const progressColor =
          object !== originalObject
            ? chalk.magenta
            : !originalObject.fetchedAt
            ? chalk.gray
            : chalk.cyan;

        const progressDecoration =
          infoPageData[index]?.response === "not-found"
            ? chalk.inverse
            : chalk.reset;

        process.stdout.write(progressDecoration(progressColor(progressSymbol)));
      }
      await writeFormattedJson(filePath, infoPageData);
      logger.log("");
    },
  });
};

autoStartCommandIfNeeded(fetchObjectInfos, __filename);
