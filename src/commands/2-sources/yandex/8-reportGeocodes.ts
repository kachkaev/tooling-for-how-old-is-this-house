import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";

import {
  ReportedGeocode,
  reportGeocodes as importedReportGeocodes,
} from "../../../shared/geocoding";
import { serializeTime } from "../../../shared/helpersForJson";
import { processFiles } from "../../../shared/processFiles";
import {
  getYandexGeocoderCacheDir,
  getYandexGeocoderCacheEntryFileSuffix,
  YandexGeocoderCacheEntry,
} from "../../../shared/sources/yandex";

export const reportGeocodes: Command = async ({ logger }) => {
  logger.log(chalk.bold(`sources/yandex: report geocodes`));

  const reportedGeocodes: ReportedGeocode[] = [];

  await processFiles({
    logger,
    fileSearchDirPath: getYandexGeocoderCacheDir(),
    fileSearchPattern: `**/*${getYandexGeocoderCacheEntryFileSuffix()}`,
    showFilePath: true,
    statusReportFrequency: 1000,
    processFile: async (filePath) => {
      const entry = (await fs.readJson(filePath)) as YandexGeocoderCacheEntry;

      const rawCoordinates: string | undefined =
        entry.data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
          ?.Point?.pos;

      const coordinates = rawCoordinates
        ? (rawCoordinates.split(" ").map((n) => parseFloat(n)) as [
            number,
            number,
          ])
        : undefined;

      reportedGeocodes.push({
        normalizedAddress: entry.normalizedAddress,
        coordinates,
        knownAt: serializeTime(),
      });
    },
  });

  process.stdout.write(
    chalk.green(
      `Saving ${reportedGeocodes.length} reported geocode${
        reportedGeocodes.length > 1 ? "s" : "s"
      }...`,
    ),
  );

  await importedReportGeocodes({
    reportedGeocodes,
    source: "yandex",
  });

  process.stdout.write(chalk.magenta(` Done.\n`));
};

autoStartCommandIfNeeded(reportGeocodes, __filename);
