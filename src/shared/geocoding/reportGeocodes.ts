import fs from "fs-extra";
import sortKeys from "sort-keys";

import { writeFormattedJson } from "../helpersForJson";
import {
  deriveNormalizedAddressSliceId,
  getDictionaryFilePath,
} from "./helpersForPaths";
import {
  GeocodeDictionary,
  ReportedGeocode,
  ResolvedGeocodeInDictionary,
} from "./types";

const trailingCommaItemKey = "↳";

const addOrRemoveTrailingCommaItem = (
  dictionary: GeocodeDictionary,
): GeocodeDictionary => {
  return Object.fromEntries(
    Object.entries(dictionary).map(([key, value]) => {
      const { [trailingCommaItemKey]: trailingCommaItem, ...rest } = value;

      if (Object.keys(rest).length === 0) {
        return [key, {}];
      }

      return [key, { ...rest, [trailingCommaItemKey]: [] }];
    }),
  );
};

const removeEmptyItems = (dictionary: GeocodeDictionary): GeocodeDictionary => {
  return Object.fromEntries(
    Object.entries(dictionary).filter(
      ([, value]) => Object.keys(value).length !== 0,
    ),
  );
};

export const reportGeocodes = async ({
  source,
  reportedGeocodes,
}: {
  logger: Console;
  source: string;
  reportedGeocodes: ReportedGeocode[];
}): Promise<void> => {
  const recordLookup: Record<string, ResolvedGeocodeInDictionary | null> = {};

  for (const reportedGeocode of reportedGeocodes) {
    const { normalizedAddress } = reportedGeocode;
    if ("coordinates" in reportedGeocode) {
      recordLookup[normalizedAddress] = [
        ...reportedGeocode.coordinates,
        reportedGeocode.knownAt,
      ];
    } else {
      recordLookup[normalizedAddress] = null;
    }
  }

  const recordLookupGroupedBySliceId: Record<
    string,
    Record<string, ResolvedGeocodeInDictionary | null>
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
      // noop: it's fine if the file does not exist at this point
    }
    for (const normalizedAddress in recordLookupInSlice) {
      const record = recordLookupInSlice[normalizedAddress];
      if (!dictionary[normalizedAddress]) {
        dictionary[normalizedAddress] = {};
      }
      if (record) {
        dictionary[normalizedAddress]![source] = record;
      }
    }

    dictionary = addOrRemoveTrailingCommaItem(dictionary);
    dictionary = removeEmptyItems(dictionary);

    await writeFormattedJson(
      dictionaryFilePath,
      sortKeys(dictionary, { deep: true }),
    );
  }
};
