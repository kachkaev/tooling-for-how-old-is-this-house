import { CommandError } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";
import { DateTime } from "luxon";

import { writeFormattedJson } from "../../helpersForJson";
import { processFiles } from "../../processFiles";
import { getObjectInfoPagesDirPath } from "./helpersForPaths";
import { InfoPageData, InfoPageObject } from "./types";

export const processRosreestrPages = async ({
  concurrencyDisabledReason,
  logger,
  pickObjectsToProcess,
  processObject,
}: {
  concurrencyDisabledReason?: string;
  logger?: Console;
  pickObjectsToProcess: (
    allInfoPageObjects: InfoPageObject[],
  ) => InfoPageObject[];
  processObject: (
    infoPageObject: Readonly<InfoPageObject>,
  ) => Promise<InfoPageObject>;
}) => {
  const scriptStartTime = DateTime.utc().toMillis();
  await processFiles({
    logger,
    fileSearchPattern: "**/page-*.json",
    fileSearchDirPath: getObjectInfoPagesDirPath(),
    showFilePath: true,
    processFile: async (filePath, prefixLength) => {
      const prefix = " ".repeat(prefixLength + 1);

      const fileStat = await fs.stat(filePath);
      if (fileStat.mtimeMs > scriptStartTime) {
        if (concurrencyDisabledReason) {
          throw new CommandError(
            `Concurrent use detected, which is not allowed. ${concurrencyDisabledReason}`,
          );
        }
        logger?.log(
          chalk.yellow(
            `${prefix}Skipping – this file is being handled by another process`,
          ),
        );

        return;
      }

      // Lock the page by updating mtime to prevent concurrent processing
      await fs.utimes(filePath, fileStat.atime, new Date());

      const infoPageData = (await fs.readJson(filePath)) as InfoPageData;
      process.stdout.write(prefix);

      const pickedObjectsSet = new Set(pickObjectsToProcess(infoPageData));

      for (let index = 0; index < infoPageData.length; index += 1) {
        const originalObject = infoPageData[index]!;
        const picked = pickedObjectsSet.has(originalObject);
        const processedObject = picked
          ? await processObject(originalObject)
          : originalObject;

        if (processedObject !== originalObject) {
          infoPageData[index] = processedObject;
          await writeFormattedJson(filePath, infoPageData);
        }

        let progressSymbol = "?";

        const latestResponse =
          (processedObject.pkkFetchedAt ?? "") >
            (processedObject.firFetchedAt ?? "") ||
          !processedObject.firFetchedAt
            ? processedObject.pkkResponse
            : processedObject.firResponse;

        if (
          processedObject.creationReason === "lotInTile" ||
          latestResponse === "lot"
        ) {
          progressSymbol = "l";
        } else if (!latestResponse) {
          progressSymbol = "·";
        } else if (latestResponse === "flat") {
          progressSymbol = "f";
        } else if (latestResponse === "not-found") {
          progressSymbol = "•";
        } else if (typeof latestResponse === "object") {
          if ("parcelData" in latestResponse) {
            progressSymbol = latestResponse.parcelData?.oksType?.[0] ?? "?";
          } else if ("attrs" in latestResponse) {
            progressSymbol = latestResponse.attrs.oks_type?.[0] ?? "?";
          }
        }

        if (processedObject.creationReason !== "gap") {
          progressSymbol = progressSymbol.toUpperCase();
        }

        const progressColor =
          processedObject !== originalObject
            ? chalk.magenta
            : !originalObject.firFetchedAt
            ? chalk.gray
            : chalk.cyan;

        const progressDecoration = picked ? chalk.inverse : chalk.reset;

        process.stdout.write(progressDecoration(progressColor(progressSymbol)));
      }
      await writeFormattedJson(filePath, infoPageData);
      logger?.log("");
    },
  });
};
