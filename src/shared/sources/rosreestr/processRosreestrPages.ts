import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import { DateTime } from "luxon";
import { WriteStream } from "node:tty";

import { writeFormattedJson } from "../../helpersForJson";
import { ScriptError } from "../../helpersForScripts";
import { processFiles } from "../../processFiles";
import { getObjectInfoPagesDirPath } from "./helpersForPaths";
import { InfoPageData, InfoPageObject } from "./types";
/**
 * @example
 *   ---⚓️-----⚓️-⚓️---⚓️-⚓️
 *     ↓ range = 2 ↓
 *   -xx-xx-xx-x-xxx-x-
 */
const findItemsAroundAnchors = <Item>(
  items: Item[],
  anchorItems: Item[],
  range: number,
): Item[] => {
  const anchorItemSet = new Set(anchorItems);
  const foundItemSet = new Set<Item>();

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item || !anchorItemSet.has(item)) {
      continue;
    }

    for (
      let index2 = Math.max(0, index - range);
      index2 <= Math.min(items.length - 1, index + range);
      index2 += 1
    ) {
      const item2 = items[index2];

      if (item2 && item2 !== item) {
        foundItemSet.add(item2);
      }
    }
  }

  return [...foundItemSet.values()];
};

/**
 * @example
 *   ------------------
 *     ↓ range = 3 ↓
 *   xxx------------xxx
 */
const findItemsAroundEnds = <Item>(items: Item[], range: number): Item[] => {
  return items.filter(
    (item, index) => index < range || items.length - index <= range,
  );
};

export const processRosreestrPages = async ({
  concurrencyDisabledReason,
  findAnchorObjects,
  includeObjectsAroundAnchors = 0,
  includeObjectsAroundEnds = 0,
  output,
  pageSaveFrequency = 1,
  processObject,
  revisit = true,
}: {
  concurrencyDisabledReason?: string;
  findAnchorObjects?: (
    allInfoPageObjects: InfoPageObject[],
  ) => InfoPageObject[];
  includeObjectsAroundAnchors?: number;
  includeObjectsAroundEnds?: number;
  output?: WriteStream | undefined;
  pageSaveFrequency?: number;
  processObject: (
    infoPageObject: Readonly<InfoPageObject>,
  ) => Promise<InfoPageObject>;
  revisit?: boolean;
}) => {
  const scriptStartTime = DateTime.utc().toMillis();
  await processFiles({
    fileSearchPattern: "**/page-*.json",
    fileSearchDirPath: getObjectInfoPagesDirPath(),
    filesNicknameToLog: "rosreestr info pages",
    output,
    processFile: async (filePath, prefixLength) => {
      const prefix = " ".repeat(prefixLength + 1);

      const fileStat = await fs.stat(filePath);
      if (fileStat.mtimeMs > scriptStartTime) {
        if (concurrencyDisabledReason) {
          throw new ScriptError(
            `Concurrent use detected, which is not allowed. ${concurrencyDisabledReason}`,
          );
        }
        output?.write(
          chalk.yellow(
            `${prefix}Skipping – this file is being handled by another process\n`,
          ),
        );

        return;
      }

      // Lock the page by updating mtime to prevent concurrent processing
      await fs.utimes(filePath, fileStat.atime, new Date());

      const infoPageData = (await fs.readJson(filePath)) as InfoPageData;

      let pickedCns: string[] = [];
      let previouslyPickedCns: string[] = [];

      do {
        const anchorObjects = findAnchorObjects
          ? findAnchorObjects(infoPageData)
          : infoPageData;
        const objectsAroundAnchors = findItemsAroundAnchors(
          infoPageData,
          anchorObjects,
          includeObjectsAroundAnchors,
        );
        const objectsAroundEnds = findItemsAroundEnds(
          infoPageData,
          includeObjectsAroundEnds,
        );

        const pickedObjectsSet = new Set([
          ...anchorObjects,
          ...objectsAroundAnchors,
          ...objectsAroundEnds,
        ]);

        pickedCns = [...pickedObjectsSet]
          .map((pickedObject) => pickedObject.cn)
          .sort();

        if (_.isEqual(pickedCns, previouslyPickedCns)) {
          break;
        }

        output?.write(prefix);

        // Compensate lack of 0 on page-000 (improve vertical alignment)
        if (infoPageData[0]?.cn?.endsWith(":1")) {
          output?.write(chalk.gray(" "));
        }

        let unsavedObjectCount = 0;
        for (let index = 0; index < infoPageData.length; index += 1) {
          const originalObject = infoPageData[index]!;
          const picked = pickedObjectsSet.has(originalObject);
          const processedObject = picked
            ? await processObject(originalObject)
            : originalObject;

          if (processedObject !== originalObject) {
            infoPageData[index] = processedObject;
            unsavedObjectCount += 1;
            if (pageSaveFrequency && unsavedObjectCount === pageSaveFrequency) {
              await writeFormattedJson(filePath, infoPageData);
              unsavedObjectCount = 0;
            }
          }

          let progressSymbol = "?";

          const latestResponse =
            (processedObject.pkkFetchedAt ?? "") >=
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
          } else if (latestResponse === "void") {
            progressSymbol = "•";
          } else if (typeof latestResponse === "object") {
            if ("parcelData" in latestResponse) {
              progressSymbol = latestResponse.parcelData.oksType?.[0] ?? "?";
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

          output?.write(progressDecoration(progressColor(progressSymbol)));
        }

        if (unsavedObjectCount) {
          await writeFormattedJson(filePath, infoPageData);
        }
        output?.write("\n");
        previouslyPickedCns = pickedCns;
      } while (revisit);
    },
  });
};
