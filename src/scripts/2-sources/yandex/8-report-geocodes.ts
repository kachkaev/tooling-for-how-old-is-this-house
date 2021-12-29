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

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("sources/yandex: Reporting geocodes\n"));

  const reportedGeocodes: ReportedGeocode[] = [];

  await processFiles({
    output,
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

  output.write(
    chalk.green(
      `Saving ${reportedGeocodes.length} reported geocode${
        reportedGeocodes.length > 1 ? "s" : ""
      }...`,
    ),
  );

  await reportGeocodes({
    reportedGeocodes,
    output,
    source: "yandex",
  });

  output.write(chalk.magenta(` Done.\n`));
};

await script();
