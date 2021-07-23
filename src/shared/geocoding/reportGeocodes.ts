import chalk from "chalk";
import _ from "lodash";
import rmUp from "rm-up";

import { normalizeAddressAtomically } from "../addresses";
import { getTerritoryAddressHandlingConfig } from "../territory";
import { debugAddressNormalizationIfEnabled } from "./debugAddressNormalizationIfEnabled";
import {
  deriveNormalizedAddressSliceId,
  ensureTerritoryGitignoreContainsGeocoding,
  getDictionaryFilePath,
} from "./helpersForPaths";
import { loadGeocodeDictionaryLookup } from "./loadGeocodeDictionaryLookup";
import { postProcessWordsInStandardizedAddressSection } from "./postProcessWordsInStandardizedAddressSection";
import {
  EmptyGeocodeInDictionary,
  GeocodeDictionary,
  GeocodeDictionaryLookup,
  ReportedGeocode,
  ResolvedGeocodeInDictionary,
} from "./types";
import { writeGeocodeDictionary } from "./writeGeocodeDictionary";

/**
 * Trailing comma item looks like this ("↳"):
 *
 *    {
 *      "область такая-то, тестовск, улица тестовая, 33": {
 *        "rosreestr": [],
 *        "osm": [12.123456, 12.123456],
 *        "↳": []
 *      }
 *    }
 *
 * When enabled, it helps keep git diffs smaller.
 * Historically the catalog of geocodes was under source control,
 * which lead to creation of this option. Although disabled by default,
 * it can still be leveraged to debug catalog changes.
 */
const trailingCommaItemKey = "↳";
const trailingCommaShouldBeAdded = false;

const addOrRemoveTrailingCommaItem = (
  dictionary: GeocodeDictionary,
): GeocodeDictionary => {
  return Object.fromEntries(
    Object.entries(dictionary).map(([key, value]) => {
      const { [trailingCommaItemKey]: trailingCommaItem, ...rest } = value;

      if (Object.keys(rest).length === 0) {
        return [key, {}];
      }

      return trailingCommaShouldBeAdded
        ? [key, { ...rest, [trailingCommaItemKey]: [] }]
        : [key, rest];
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
  if (logger) {
    process.stdout.write(chalk.green("Preparing to report geocodes..."));
  }

  const addressHandlingConfig = await getTerritoryAddressHandlingConfig(logger);
  const sourceDictionary: GeocodeDictionary = {};
  const weightDictionary: Record<string, number> = {};

  for (const reportedGeocode of reportedGeocodes) {
    const normalizedAddresses = normalizeAddressAtomically(
      reportedGeocode.address,
      addressHandlingConfig,
      postProcessWordsInStandardizedAddressSection,
    );

    if (!normalizedAddresses.length) {
      logger?.log(
        chalk.yellow(
          `Skipping "${reportedGeocode.address}" (normalized address is empty)`,
        ),
      );
      continue;
    }

    for (const normalizedAddress of normalizedAddresses) {
      debugAddressNormalizationIfEnabled({
        address: reportedGeocode.address,
        normalizedAddress,
        addressNormalizationConfig: addressHandlingConfig,
        logger,
      });

      const existingWeight = weightDictionary[normalizedAddress];
      const reportedWeight =
        "weight" in reportedGeocode ? reportedGeocode.weight : -1;
      if (
        typeof existingWeight === "number" &&
        existingWeight > reportedWeight
      ) {
        continue;
      }

      const geocode: ResolvedGeocodeInDictionary | EmptyGeocodeInDictionary =
        "coordinates" in reportedGeocode && reportedGeocode.coordinates
          ? reportedGeocode.coordinates
          : [];
      sourceDictionary[normalizedAddress] = { [source]: geocode };
      weightDictionary[normalizedAddress] = reportedWeight;
    }
  }

  const sourceDictionaryLookup: GeocodeDictionaryLookup = {};

  for (const normalizedAddress in sourceDictionary) {
    const addressRecord = sourceDictionary[normalizedAddress]!;
    const sliceId = deriveNormalizedAddressSliceId(
      normalizedAddress,
      addressHandlingConfig,
    );
    if (!sourceDictionaryLookup[sliceId]) {
      sourceDictionaryLookup[sliceId] = {};
    }
    sourceDictionaryLookup[sliceId]![normalizedAddress] = addressRecord;
  }

  if (logger) {
    process.stdout.write(` Done.\n`);
  }

  const existingDictionaryLookup = await loadGeocodeDictionaryLookup(logger);

  if (logger) {
    process.stdout.write(chalk.green("Writing changes to dictionaries..."));
  }

  ensureTerritoryGitignoreContainsGeocoding();

  let numberOfDictionariesCreated = 0;
  let numberOfDictionariesUpdated = 0;
  let numberOfDictionariesDeleted = 0;

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
      numberOfDictionariesDeleted += 1;
      continue;
    }

    if (_.isEqual(existingDictionaryLookup[sliceId], dictionary)) {
      continue;
    }

    if (existingDictionaryLookup[sliceId]) {
      numberOfDictionariesUpdated += 1;
    } else {
      numberOfDictionariesCreated += 1;
    }

    await writeGeocodeDictionary(dictionaryFilePath, dictionary);
  }

  if (logger) {
    process.stdout.write(
      ` Dictionaries created: ${numberOfDictionariesCreated}, updated: ${numberOfDictionariesUpdated}, deleted: ${numberOfDictionariesDeleted}.\n`,
    );
  }
};
