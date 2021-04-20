import _ from "lodash";
import rmUp from "rm-up";

import {
  deriveNormalizedAddressSliceId,
  getDictionaryFilePath,
} from "./helpersForPaths";
import { loadGeocodeDictionaryLookup } from "./loadGeocodeDictionaryLookup";
import {
  EmptyGeocodeInDictionary,
  GeocodeDictionary,
  GeocodeDictionaryLookup,
  ReportedGeocode,
  ResolvedGeocodeInDictionary,
} from "./types";
import { writeGeocodeDictionary } from "./writeGeocodeDictionary";

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
  logger,
  reportedGeocodes,
  source,
}: {
  logger?: Console;
  reportedGeocodes: ReportedGeocode[];
  source: string;
}): Promise<void> => {
  const sourceDictionary: GeocodeDictionary = {};

  for (const reportedGeocode of reportedGeocodes) {
    const { normalizedAddress } = reportedGeocode;
    const geocode: ResolvedGeocodeInDictionary | EmptyGeocodeInDictionary =
      "coordinates" in reportedGeocode
        ? reportedGeocode.knownAt
          ? [...reportedGeocode.coordinates, reportedGeocode.knownAt]
          : reportedGeocode.coordinates
        : [];
    sourceDictionary[normalizedAddress] = { [source]: geocode };
  }

  const sourceDictionaryLookup: GeocodeDictionaryLookup = {};

  for (const normalizedAddress in sourceDictionary) {
    const addressRecord = sourceDictionary[normalizedAddress]!;
    const sliceId = deriveNormalizedAddressSliceId(normalizedAddress);
    if (!sourceDictionaryLookup[sliceId]) {
      sourceDictionaryLookup[sliceId] = {};
    }
    sourceDictionaryLookup[sliceId]![normalizedAddress] = addressRecord;
  }

  const existingDictionaryLookup = await loadGeocodeDictionaryLookup(logger);
  const allSliceIds = _.orderBy(
    _.uniq([
      ..._.keys(existingDictionaryLookup),
      ..._.keys(sourceDictionaryLookup),
    ]),
  );

  for (const sliceId of allSliceIds) {
    let dictionary = existingDictionaryLookup[sliceId] ?? {};

    // Remove previous values
    dictionary = _.mapValues(dictionary, (addressRecord) => {
      const { [source]: sourceRecord, ...rest } = addressRecord;

      return rest;
    });

    // Add new values
    dictionary = _.defaultsDeep(
      {},
      dictionary,
      sourceDictionaryLookup[sliceId],
    );

    // Clean
    dictionary = addOrRemoveTrailingCommaItem(dictionary);
    dictionary = removeEmptyItems(dictionary);

    // Create, update or delete dictionary
    const dictionaryFilePath = getDictionaryFilePath(sliceId);
    if (_.isEmpty(dictionary)) {
      await rmUp(dictionaryFilePath, { deleteInitial: true });
      continue;
    }

    if (_.isEqual(existingDictionaryLookup[sliceId], dictionary)) {
      continue;
    }

    await writeGeocodeDictionary(dictionaryFilePath, dictionary);
  }
};
