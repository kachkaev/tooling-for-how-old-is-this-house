import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";
import sortKeys from "sort-keys";

import { extractYearFromCompletionDates } from "../../../shared/completionDates";
import { extractSerializedTimeFromPrependedHtmlComment } from "../../../shared/helpersForHtml";
import {
  serializeTime,
  writeFormattedJson,
} from "../../../shared/helpersForJson";
import {
  getHouseFilePath,
  HouseInfo,
  HouseInfoFile,
  loopThroughHouseLists,
  loopThroughRowsInHouseList,
} from "../../../shared/sources/mingkh";

export const parseRawHouseInfos: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/mingkh: Parsing raw house infos"));

  await loopThroughHouseLists(async ({ houseListFilePath }) => {
    await loopThroughRowsInHouseList(houseListFilePath, async ({ houseId }) => {
      const rawHouseInfoFilePath = getHouseFilePath(houseId, "raw-info.html");

      const houseInfoFilePath = getHouseFilePath(houseId, "info.json");

      if (await fs.pathExists(houseInfoFilePath)) {
        process.stdout.write(
          chalk.gray(` Skipped because file exists: ${houseInfoFilePath}\n`),
        );

        return;
      }

      process.stdout.write(` Parsing...`);

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
      const year = extractYearFromCompletionDates(yearMatch?.[0]);
      if (year) {
        info.year = year;
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

      await writeFormattedJson(houseInfoFilePath, houseInfoFileJson);

      process.stdout.write(
        ` Result saved to ${chalk.magenta(houseInfoFilePath)}\n`,
      );
    });
  });
};

autoStartCommandIfNeeded(parseRawHouseInfos, __filename);
