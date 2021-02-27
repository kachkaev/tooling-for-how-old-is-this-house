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
  const scriptStartTime = new DateTime().toMillis();
  await processFiles({
    logger,
    fileSearchPattern: `**/page-*.json`,
    fileSearchDirPath: getObjectInfoPagesDirPath(),
    showFilePath: true,
    processFile: async (filePath, prefixLength) => {
      const fileStat = await fs.stat(filePath);
      if (fileStat.mtimeMs > scriptStartTime) {
        if (concurrencyDisabledReason) {
          throw new CommandError(
            `Concurrent use detected, which is not allowed. ${concurrencyDisabledReason}`,
          );
        }
        logger?.log(
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

      const pickedObjectsSet = new Set(pickObjectsToProcess(infoPageData));

      for (const originalObject of infoPageData) {
        const picked = pickedObjectsSet.has(originalObject);
        const processedObject = picked
          ? await processObject(originalObject)
          : originalObject;

        if (processedObject !== originalObject) {
          await writeFormattedJson(filePath, infoPageData);
        }

        let progressSymbol = "?";

        if (
          processedObject.creationReason === "lotInTile" ||
          processedObject.firResponse === "lot"
        ) {
          progressSymbol = "l";
        } else if (processedObject.firResponse === "flat") {
          progressSymbol = "f";
        } else if (processedObject.firResponse === "not-found") {
          progressSymbol = "•";
        } else if (typeof processedObject.firResponse === "object") {
          progressSymbol =
            processedObject.firResponse.parcelData?.oksType?.[0] ?? "?";
        } else if (typeof processedObject.pkkResponse === "object") {
          progressSymbol =
            processedObject.pkkResponse.attrs.oks_type?.[0] ?? "?";
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

        const progressDecoration = picked ? chalk.reset : chalk.inverse;

        process.stdout.write(progressDecoration(progressColor(progressSymbol)));
      }
      await writeFormattedJson(filePath, infoPageData);
      logger?.log("");
    },
  });
};
