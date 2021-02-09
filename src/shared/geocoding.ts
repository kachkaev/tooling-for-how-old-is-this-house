import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

import { splitNormalisedAddress } from "./addressing";
import { writeFormattedJson } from "./helpersForJson";
import { processFiles } from "./processFiles";
import { getRegionDirPath } from "./region";

export type Position = [lot: number, lat: number];

export interface ReportedUnresolvedGeocode {
  normalizedAddress: string;
}

export interface ReportedResolvedGeocode {
  normalizedAddress: string;
  position: Position;
  fetchedAt: string;
}

export type ReportedGeocode = ReportedResolvedGeocode | ReportedResolvedGeocode;

export type GeocodeSourceRecord = [lon: number, lat: number, fetchedAt: string];
export type GeocodeAddressRecord = Record<string, GeocodeSourceRecord>;
export type GeocodeDictionary = Record<string, GeocodeAddressRecord>;
export type GeocodeDictionaryLookup = Record<string, GeocodeDictionary>;

/*
{
  "my address": {
    "source1": [x, y, "fetchedAt"],
    "source2": [x, y, "fetchedAt"]
  },
  "my address 2": {
    "source3": [x, y, "fetchedAt"]
  },
  "my address 3": {}
}
*/

const getGeocodeDictionariesDirPath = () => {
  return path.resolve(getRegionDirPath(), "geocoding");
};

const getGeocodeDictionaryFileName = () => "dictionary.json";

const getDictionaryFilePath = (sliceId: string) => {
  return path.resolve(
    getGeocodeDictionariesDirPath(),
    ...sliceId,
    getGeocodeDictionaryFileName(),
  );
};

const deriveNormalizedAddressSliceId = (normalizedAddress: string): string => {
  return splitNormalisedAddress(normalizedAddress).slice(0, 3).join("/");
};

const loadGeocodeDictionaryLookup = async (
  logger?: Console,
): Promise<GeocodeDictionaryLookup> => {
  if (logger) {
    process.stdout.write(chalk.green("Loading geocode dictionaries..."));
  }

  const result: GeocodeDictionaryLookup = {};
  const geocodeDictionariesDirPath = getGeocodeDictionariesDirPath();
  await processFiles({
    logger,
    fileSearchDirPath: geocodeDictionariesDirPath,
    statusReportFrequency: 0,
    fileSearchPattern: `**/${getGeocodeDictionaryFileName()}`,
    processFile: async (filePath) => {
      const dictionary: GeocodeDictionary = await fs.readJson(filePath);
      const relativeFilePath = path.relative(
        geocodeDictionariesDirPath,
        filePath,
      );
      const relativeFileDir = path.dirname(relativeFilePath);
      const sliceId = relativeFileDir.replaceAll(path.sep, "/");
      result[sliceId] = dictionary;
    },
  });

  if (logger) {
    process.stdout.write(`Done (${result.length} loaded).\n`);
  }

  return result;
};

export const loadCombinedGeocodeDictionary = async (
  logger?: Console,
): Promise<GeocodeDictionary> => {
  const geocodeDictionaryLookup = await loadGeocodeDictionaryLookup(logger);

  return Object.assign({}, ...Object.values(geocodeDictionaryLookup));
};

export const reportGeocodes = async (
  source: string,
  reportedGeocodes: ReportedGeocode[],
): Promise<void> => {
  const recordLookup: Record<string, GeocodeSourceRecord | null> = {};

  for (const reportedGeocode of reportedGeocodes) {
    const { normalizedAddress } = reportedGeocode;
    if ("position" in reportedGeocode) {
      recordLookup[normalizedAddress] = [
        ...reportedGeocode.position,
        reportedGeocode.fetchedAt,
      ];
    } else {
      recordLookup[normalizedAddress] = null;
    }
  }

  const recordLookupGroupedBySliceId: Record<
    string,
    Record<string, GeocodeSourceRecord | null>
  > = {};

  for (const normalizedAddress in recordLookup) {
    const record = recordLookup[normalizedAddress];
    const sliceId = deriveNormalizedAddressSliceId(normalizedAddress);
    if (!recordLookupGroupedBySliceId[sliceId]) {
      recordLookupGroupedBySliceId[sliceId] = {};
    }
    recordLookupGroupedBySliceId[sliceId]![normalizedAddress] = record ?? null;
  }

  for (const sliceId in recordLookupGroupedBySliceId) {
    const recordLookupInSlice = recordLookupGroupedBySliceId[sliceId]!;
    const dictionaryFilePath = getDictionaryFilePath(sliceId);
    let dictionary: GeocodeDictionary = {};
    try {
      dictionary = await fs.readJson(dictionaryFilePath);
    } catch {
      // noop: it's fine if the file does not exist
    }
    for (const normalizedAddress in recordLookupInSlice) {
      const record = recordLookupInSlice[normalizedAddress];
      if (dictionary[normalizedAddress]) {
        dictionary[normalizedAddress] = {};
      }
      if (record) {
        dictionary[normalizedAddress]![source] = record;
      }
    }
    await writeFormattedJson(dictionaryFilePath, dictionary);
  }
};

export const resolvePosition = async (
  combinedGeocodeDictionary: GeocodeDictionary,
  normalizedAddress: string,
  sourcesInPriorityOrder: string[],
): Promise<Position | undefined> => {
  const addressRecord = combinedGeocodeDictionary[normalizedAddress];
  if (!addressRecord) {
    return undefined;
  }

  for (const source of sourcesInPriorityOrder) {
    const sourceRecord = addressRecord[source];
    if (sourceRecord) {
      return [sourceRecord[0], sourceRecord[1]];
    }
  }

  return undefined;
};

export const listNormalizedAddressesWithoutPosition = async (): Promise<
  string[]
> => {
  return [];
};
