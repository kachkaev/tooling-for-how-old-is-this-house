import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import path from "node:path";
import sortKeys from "sort-keys";

import { extractSerializedTimeFromPrependedHtmlComment } from "../../../shared/helpers-for-html";
import {
  serializeTime,
  writeFormattedJson,
} from "../../../shared/helpers-for-json";
import { processFiles } from "../../../shared/process-files";
import {
  getHouseFilePath,
  getMingkhHousesDirPath,
  HouseInfo,
  HouseInfoFile,
} from "../../../shared/source-mingkh";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("sources/mingkh: Parsing raw house infos\n"));

  let numberOfJsonsWritten = 0;
  let numberOfJsonsSkipped = 0;

  await processFiles({
    fileSearchDirPath: getMingkhHousesDirPath(),
    fileSearchPattern: "**/*-raw-info.html",
    filesNicknameToLog: "raw house infos",
    output,
    processFile: async (
      rawHouseInfoFilePath,
      prefixLength,
      reportingStatus,
    ) => {
      const houseId = Number.parseInt(path.basename(rawHouseInfoFilePath));
      const houseInfoFilePath = getHouseFilePath(houseId, "info.json");

      const rawInfo = await fs.readFile(rawHouseInfoFilePath, "utf8");

      const info: HouseInfo = {
        id: houseId,
      };

      // extract centerPoint
      const lonMatch = rawInfo.match(
        /<input type="hidden" id="mapcenterlng" name="mapcenterlng" value="(.*)"\/>/,
      );
      const lon = Number.parseFloat(lonMatch?.[1] ?? "");
      const latMatch = rawInfo.match(
        /<input type="hidden" id="mapcenterlat" name="mapcenterlat" value="(.*)"\/>/,
      );
      const lat = Number.parseFloat(latMatch?.[1] ?? "");

      if (lon && lat) {
        info.centerPoint = [lon, lat];
      }

      // extract address
      const addressMatch = rawInfo.match(
        /<dt>Адрес<\/dt>\s*<d{2}>(.*)(?:&nbsp;){3}<a/,
      );
      const address = addressMatch?.[1]?.trim();
      if (address) {
        info.address = address;
      }

      // extract year
      const yearMatch = rawInfo.match(
        /<dt>Год постройки<\/dt>\s*<dd>(\d{4})<\/dd>/,
      );
      const year = Number.parseInt(yearMatch?.[1] ?? "");
      if (year) {
        info.year = year;
      }

      // extract numberOfFloors
      const numberOfFloorsMatch = rawInfo.match(
        /<dt>Количество этажей<\/dt>\s*<dd>(.*)<\/dd>/,
      );
      const numberOfFloors = Number.parseInt(numberOfFloorsMatch?.[1] ?? "");
      if (numberOfFloors) {
        info.numberOfFloors = numberOfFloors;
      }

      // extract numberOfLivingQuarters
      const numberOfLivingQuartersMatch = rawInfo.match(
        /<dt>Жилых помещений<\/dt>\s*<dd>(.*)<\/dd>/,
      );
      const numberOfLivingQuarters = Number.parseInt(
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
        const existingHouseInfoFileJson = (await fs.readJson(
          houseInfoFilePath,
        )) as HouseInfoFile;
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
          output.write(
            `${" ".repeat(prefixLength + 1)}${chalk.gray(
              houseInfoFilePath,
            )} (already up to date)\n`,
          );
        }

        return;
      }

      await writeFormattedJson(houseInfoFilePath, houseInfoFileJson);
      numberOfJsonsWritten += 1;

      if (reportingStatus) {
        output.write(
          `${" ".repeat(prefixLength + 1)}${chalk.magenta(
            houseInfoFilePath,
          )}\n`,
        );
      }
    },
    statusReportFrequency: 500,
  });

  output.write(
    `Done. Number of JSON files written: ${numberOfJsonsWritten}, kept as is: ${numberOfJsonsSkipped}.\n`,
  );
};

await script();
