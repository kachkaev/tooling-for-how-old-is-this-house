import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
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
  SuccessfulFirObjectResponse,
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

export const generateInfoPages: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/rosreestr: Fetching object infos"));

  await processFiles({
    logger,
    fileSearchPattern: `**/page-*.json`,
    fileSearchDirPath: getObjectInfoPagesDirPath(),
    showFilePath: true,
    statusReportFrequency: 1,
    processFile: async (filePath) => {
      const infoPageData = (await fs.readJson(filePath)) as InfoPageData;
      process.stdout.write(" ".repeat(12));

      const indexesInRange = new Set<number>();
      const range = parseInt(process.env.RANGE ?? "") || 0;
      for (let index = -1; index <= infoPageData.length; index += 1) {
        const shouldTreatAsAnchor =
          index === -1 ||
          index === infoPageData.length ||
          infoPageData[index]?.creationReason !== "gap";

        if (!shouldTreatAsAnchor) {
          continue;
        }

        for (
          let index2 = Math.max(0, index - range);
          index2 <= Math.min(infoPageData.length - 1, index + range);
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

        let progressSymbol = "•";
        let progressColor = !originalObject.fetchedAt ? chalk.gray : chalk.cyan;

        if (originalObject.creationReason === "lotInTile") {
          progressSymbol = "l";
        } else if (originalObject.creationReason === "ccoInTile") {
          progressSymbol = "c";
        }

        if (indexesInRange.has(index) && !originalObject.fetchedAt) {
          const apiResponse = await fetchJsonFromRosreestr(
            `https://rosreestr.gov.ru/api/online/fir_object/${convertCnToId(
              originalObject.cn,
            )}`,
          );

          if (apiResponse.status !== 200) {
            infoPageData[index] = {
              ...originalObject,
              fetchedAt: getSerialisedNow(),
              response: apiResponse.status,
            };
          } else {
            const responseData = apiResponse.data as SuccessfulFirObjectResponse;
            delete responseData["oldNumbers"];
            infoPageData[index] = {
              ...originalObject,
              fetchedAt: getSerialisedNow(),
              response: sortKeys(deepClean(responseData), { deep: true }),
            };
          }

          progressColor = chalk.magenta;
          await writeFormattedJson(filePath, infoPageData);
        }

        const progressBackground =
          typeof infoPageData[index]?.response === "number"
            ? chalk.strikethrough
            : chalk.reset;

        process.stdout.write(progressBackground(progressColor(progressSymbol)));
      }
      logger.log("");
    },
  });
};

autoStartCommandIfNeeded(generateInfoPages, __filename);
