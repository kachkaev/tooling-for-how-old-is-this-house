import chalk from "chalk";
import fs from "fs-extra";
import rmUp from "rm-up";
import sleep from "sleep-promise";

import { loadCombinedGeocodeDictionary } from "../../../shared/geocoding";
import { eraseLastLineInOutput } from "../../../shared/helpersForScripts";
import { processFiles } from "../../../shared/processFiles";
import {
  addressIsWorthKeepingInYandexCache,
  getYandexGeocoderCacheDir,
  getYandexGeocoderCacheEntryFileSuffix,
  YandexGeocoderCacheEntry,
} from "../../../shared/sources/yandex";
import { getTerritoryAddressHandlingConfig } from "../../../shared/territory";

const output = process.stdout;

const script = async () => {
  output.write(
    chalk.bold(`sources/yandex: Deleting cache entries for unused addresses\n`),
  );

  const addressHandlingConfig = await getTerritoryAddressHandlingConfig(output);
  const combinedGeocodeDictionary = await loadCombinedGeocodeDictionary();
  const filePathsToDelete: string[] = [];

  const needsDeleting = (cacheEntry: YandexGeocoderCacheEntry): boolean => {
    const geocodeAddressRecord =
      combinedGeocodeDictionary[cacheEntry.normalizedAddress];
    if (!geocodeAddressRecord) {
      return true;
    }

    if (
      !addressIsWorthKeepingInYandexCache(
        cacheEntry.normalizedAddress,
        addressHandlingConfig,
      )
    ) {
      return true;
    }

    const geocodeSources = Object.keys(geocodeAddressRecord);
    if (geocodeSources.length === 1 && geocodeSources[0] === "yandex") {
      return true;
    }

    return false;
  };

  await processFiles({
    output,
    fileSearchDirPath: getYandexGeocoderCacheDir(),
    fileSearchPattern: `**/*${getYandexGeocoderCacheEntryFileSuffix()}`,
    filesNicknameToLog: "yandex geocoder cache entries",
    statusReportFrequency: 1000,
    processFile: async (filePath) => {
      const cacheEntry = (await fs.readJson(
        filePath,
      )) as YandexGeocoderCacheEntry;
      if (needsDeleting(cacheEntry)) {
        filePathsToDelete.push(filePath);
      }
    },
  });

  if (!filePathsToDelete.length) {
    output.write(chalk.gray("No files to delete.\n"));

    return;
  }

  output.write(
    chalk.yellow(
      `Files to delete: ${filePathsToDelete.length}\nPress ctrl+c now to abort\n`,
    ),
  );

  for (let ttl = 10; ttl >= 0; ttl -= 1) {
    output.write(`${chalk.gray(ttl)}\n`);
    await sleep(1000);
    eraseLastLineInOutput(output);
  }

  output.write(chalk.green(`Deleting...`));
  for (const filePath of filePathsToDelete) {
    await rmUp(filePath, { deleteInitial: true });
  }
  output.write(chalk.magenta(` Done.\n`));
};

await script();
