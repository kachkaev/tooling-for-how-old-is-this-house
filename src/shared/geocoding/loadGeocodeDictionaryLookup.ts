import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { WriteStream } from "tty";

import { processFiles } from "../processFiles";
import {
  getGeocodeDictionariesDirPath,
  getGeocodeDictionaryFileName,
} from "./helpersForPaths";
import { GeocodeDictionary, GeocodeDictionaryLookup } from "./types";

export const loadGeocodeDictionaryLookup = async (
  output?: WriteStream,
): Promise<GeocodeDictionaryLookup> => {
  output?.write(chalk.green("Loading geocode dictionaries..."));

  const result: GeocodeDictionaryLookup = {};
  const geocodeDictionariesDirPath = getGeocodeDictionariesDirPath();
  await processFiles({
    fileSearchDirPath: geocodeDictionariesDirPath,
    statusReportFrequency: 0,
    fileSearchPattern: `**/${getGeocodeDictionaryFileName()}`,
    filesNicknameToLog: "geocode dictionaries",
    processFile: async (filePath) => {
      const dictionary: GeocodeDictionary = await fs.readJson(filePath);
      const relativeFilePath = path.relative(
        geocodeDictionariesDirPath,
        filePath,
      );
      const relativeFileDir = path.dirname(relativeFilePath);
      const sliceId = relativeFileDir.split(path.sep).join("/");
      result[sliceId] = dictionary;
    },
  });

  output?.write(` Dictionaries loaded: ${Object.keys(result).length}.\n`);

  return result;
};
