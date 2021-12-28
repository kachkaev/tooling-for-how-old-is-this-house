import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";

import { ReportedGeocode, reportGeocodes } from "../../../shared/geocoding";
import { Point2dCoordinates } from "../../../shared/helpersForGeometry";
import { processFiles } from "../../../shared/processFiles";
import {
  getYandexGeocoderCacheDir,
  getYandexGeocoderCacheEntryFileSuffix,
  YandexGeocoderCacheEntry,
} from "../../../shared/sources/yandex";

const command: Command = async ({ logger }) => {
  logger.log(chalk.bold(`sources/yandex: Reporting geocodes`));

  const reportedGeocodes: ReportedGeocode[] = [];

  await processFiles({
    logger,
    fileSearchDirPath: getYandexGeocoderCacheDir(),
    fileSearchPattern: `**/*${getYandexGeocoderCacheEntryFileSuffix()}`,
    filesNicknameToLog: "yandex geocoder cache entries",
    statusReportFrequency: 1000,
    processFile: async (filePath) => {
      const entry = (await fs.readJson(filePath)) as YandexGeocoderCacheEntry;

      let coordinates: Point2dCoordinates | undefined = undefined;

      const geoObject =
        entry.data?.response?.GeoObjectCollection?.featureMember?.[0]
          ?.GeoObject;
      const rawCoordinates: string | undefined = geoObject?.Point?.pos;

      const [lon, lat] =
        rawCoordinates?.split(" ").map((n) => parseFloat(n)) ?? [];

      if (lon && lat) {
        coordinates = [lon, lat];
      }

      const precision =
        geoObject?.metaDataProperty?.GeocoderMetaData?.precision;

      if (!coordinates || precision !== "exact") {
        reportedGeocodes.push({
          address: entry.normalizedAddress,
        });
      } else {
        reportedGeocodes.push({
          address: entry.normalizedAddress,
          coordinates,
        });
      }
    },
  });

  process.stdout.write(
    chalk.green(
      `Saving ${reportedGeocodes.length} reported geocode${
        reportedGeocodes.length > 1 ? "s" : ""
      }...`,
    ),
  );

  await reportGeocodes({
    reportedGeocodes,
    logger,
    source: "yandex",
  });

  process.stdout.write(chalk.magenta(` Done.\n`));
};

autoStartCommandIfNeeded(command, __filename);

export default command;
