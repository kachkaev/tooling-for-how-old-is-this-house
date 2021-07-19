import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import sortKeys from "sort-keys";

import { extractSerializedTimeFromPrependedHtmlComment } from "../../../shared/helpersForHtml";
import {
  serializeTime,
  writeFormattedJson,
} from "../../../shared/helpersForJson";
import { parseCompletionDates } from "../../../shared/parseCompletionDates";
import { processFiles } from "../../../shared/processFiles";
import {
  getHouseFilePath,
  getMingkhHousesDirPath,
  HouseInfo,
  HouseInfoFile,
} from "../../../shared/sources/mingkh";

export const parseRawHouseInfos: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/mingkh: Parsing raw house infos"));

  let numberOfJsonsWritten = 0;
  let numberOfJsonsSkipped = 0;

  await processFiles({
    fileSearchDirPath: getMingkhHousesDirPath(),
    fileSearchPattern: "**/*-raw-info.html",
    filesNicknameToLog: "raw house infos",
    logger,
    processFile: async (
      rawHouseInfoFilePath,
      prefixLength,
      reportingStatus,
    ) => {
      const houseId = parseInt(path.basename(rawHouseInfoFilePath));
      const houseInfoFilePath = getHouseFilePath(houseId, "info.json");

      const rawInfo = await fs.readFile(rawHouseInfoFilePath, "utf8");

      const info: HouseInfo = {
        id: houseId,
      };

      // extract centerPoint
      const lonMatch = rawInfo.match(
        /<input type="hidden" id="mapcenterlng" name="mapcenterlng" value="(.*)"\/>/,
      );
      const lon = parseFloat(lonMatch?.[1] ?? "");
      const latMatch = rawInfo.match(
        /<input type="hidden" id="mapcenterlat" name="mapcenterlat" value="(.*)"\/>/,
      );
      const lat = parseFloat(latMatch?.[1] ?? "");

      if (lon && lat) {
        info.centerPoint = [lon, lat];
      }

      // extract address
      const addressMatch = rawInfo.match(
        /<dt>Адрес<\/dt>\s*<dd>(.*)&nbsp;&nbsp;&nbsp;<a/,
      );
      const address = addressMatch?.[1]?.trim();
      if (address) {
        info.address = address;
      }

      // extract year
      const yearMatch = rawInfo.match(
        /<dt>Год постройки<\/dt>\s*<dd>(.*)<\/dd>/,
      );
      const { derivedCompletionYear } = parseCompletionDates(yearMatch?.[1]);
      if (derivedCompletionYear) {
        info.year = derivedCompletionYear;
      }

      // extract numberOfFloors
      const numberOfFloorsMatch = rawInfo.match(
        /<dt>Количество этажей<\/dt>\s*<dd>(.*)<\/dd>/,
      );
      const numberOfFloors = parseInt(numberOfFloorsMatch?.[1] ?? "");
      if (numberOfFloors) {
        info.numberOfFloors = numberOfFloors;
      }

      // extract numberOfLivingQuarters
      const numberOfLivingQuartersMatch = rawInfo.match(
        /<dt>Жилых помещений<\/dt>\s*<dd>(.*)<\/dd>/,
      );
      const numberOfLivingQuarters = parseInt(
        numberOfLivingQuartersMatch?.[1] ?? "",
      );
      if (numberOfLivingQuarters) {
        info.numberOfLivingQuarters = numberOfLivingQuarters;
      }

      // extract cadastralId
      const cadastralIdMatch = rawInfo.match(
        /<dt>Кадастровый номер<\/dt>\s*<dd>(.*)<\/dd>/,
      );
      const cadastralId = cadastralIdMatch?.[1]?.trim();
      if (cadastralId) {
        info.cadastralId = cadastralId;
      }

      const houseInfoFileJson: HouseInfoFile = {
        fetchedAt: extractSerializedTimeFromPrependedHtmlComment(rawInfo),
        parsedAt: serializeTime(),
        data: sortKeys(info),
      };

      let needToWriteFile = true;
      try {
        const existingHouseInfoFileJson = await fs.readJson(houseInfoFilePath);
        if (
          _.isEqual(
            _.omit(existingHouseInfoFileJson, "parsedAt"),
            _.omit(houseInfoFileJson, "parsedAt"),
          )
        ) {
          needToWriteFile = false;
        }
      } catch {
        // Noop (new file)
      }

      if (!needToWriteFile) {
        numberOfJsonsSkipped += 1;
        if (reportingStatus) {
          logger.log(
            `${" ".repeat(prefixLength + 1)}${chalk.gray(
              houseInfoFilePath,
            )} (already up to date)`,
          );
        }

        return;
      }

      await writeFormattedJson(houseInfoFilePath, houseInfoFileJson);
      numberOfJsonsWritten += 1;

      if (reportingStatus) {
        logger.log(
          `${" ".repeat(prefixLength + 1)}${chalk.magenta(houseInfoFilePath)}`,
        );
      }
    },
    statusReportFrequency: 500,
  });

  logger.log(
    `Done. Number of JSON files written: ${numberOfJsonsWritten}, kept as is: ${numberOfJsonsSkipped}.`,
  );
};

autoStartCommandIfNeeded(parseRawHouseInfos, __filename);
