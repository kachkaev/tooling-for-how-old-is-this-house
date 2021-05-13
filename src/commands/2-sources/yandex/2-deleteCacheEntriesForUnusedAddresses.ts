import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";
import rmUp from "rm-up";
import sleep from "sleep-promise";

import { loadCombinedGeocodeDictionary } from "../../../shared/geocoding";
import { processFiles } from "../../../shared/processFiles";
import {
  getYandexGeocoderCacheDir,
  getYandexGeocoderCacheEntryFileSuffix,
  YandexGeocoderCacheEntry,
} from "../../../shared/sources/yandex";

export const deleteCacheEntriesForUnusedAddresses: Command = async ({
  logger,
}) => {
  logger.log(
    chalk.bold(`sources/yandex: Deleting cache entries for unused addresses`),
  );

  const combinedGeocodeDictionary = await loadCombinedGeocodeDictionary();
  const filePathsToDelete: string[] = [];

  await processFiles({
    logger,
    fileSearchDirPath: getYandexGeocoderCacheDir(),
    fileSearchPattern: `**/*${getYandexGeocoderCacheEntryFileSuffix()}`,
    filesNicknameToLog: "yandex geocoder cache entries",
    showFilePath: true,
    statusReportFrequency: 1000,
    processFile: async (filePath) => {
      const entry = (await fs.readJson(filePath)) as YandexGeocoderCacheEntry;
      if (!combinedGeocodeDictionary[entry.normalizedAddress]) {
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
    process.stdout.moveCursor?.(0, -1);
    process.stdout.clearScreenDown?.();
  }

  process.stdout.write(chalk.green(`Deleting...`));
  for (const filePath of filePathsToDelete) {
    await rmUp(filePath, { deleteInitial: true });
  }
  process.stdout.write(chalk.magenta(` Done.\n`));
};

autoStartCommandIfNeeded(deleteCacheEntriesForUnusedAddresses, __filename);
