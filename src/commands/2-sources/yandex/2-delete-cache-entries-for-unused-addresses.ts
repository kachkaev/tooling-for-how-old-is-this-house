import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";
import rmUp from "rm-up";
import sleep from "sleep-promise";

import { loadCombinedGeocodeDictionary } from "../../../shared/geocoding";
import { eraseLastLineInOutput } from "../../../shared/helpersForCommands";
import { processFiles } from "../../../shared/processFiles";
import {
  addressIsWorthKeepingInYandexCache,
  getYandexGeocoderCacheDir,
  getYandexGeocoderCacheEntryFileSuffix,
  YandexGeocoderCacheEntry,
} from "../../../shared/sources/yandex";
import { getTerritoryAddressHandlingConfig } from "../../../shared/territory";

const command: Command = async ({ logger }) => {
  logger.log(
    chalk.bold(`sources/yandex: Deleting cache entries for unused addresses`),
  );

  const addressHandlingConfig = await getTerritoryAddressHandlingConfig(logger);
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
    logger,
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
    logger.log(chalk.gray("No files to delete."));

    return;
  }

  logger.log(
    chalk.yellow(
      `Files to delete: ${filePathsToDelete.length}\nPress ctrl+c now to abort`,
    ),
  );

  for (let ttl = 10; ttl >= 0; ttl -= 1) {
    logger.log(chalk.gray(ttl));
    await sleep(1000);
    eraseLastLineInOutput(logger);
  }

  process.stdout.write(chalk.green(`Deleting...`));
  for (const filePath of filePathsToDelete) {
    await rmUp(filePath, { deleteInitial: true });
  }
  process.stdout.write(chalk.magenta(` Done.\n`));
};

autoStartCommandIfNeeded(command, __filename);

export default command;
