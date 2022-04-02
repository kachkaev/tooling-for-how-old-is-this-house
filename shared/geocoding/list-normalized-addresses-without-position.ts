import { GeocodeDictionary } from "./types";

export const listNormalizedAddressesWithoutPosition = ({
  combinedGeocodeDictionary,
  sourcesToIgnore,
}: {
  combinedGeocodeDictionary: GeocodeDictionary;
  sourcesToIgnore?: string[];
}): string[] => {
  const result: string[] = [];

  for (const [normalizedAddress, recordForAddress] of Object.entries(
    combinedGeocodeDictionary,
  )) {
    const recordEntries = Object.entries(recordForAddress);
    const recordEntriesWithoutIgnoredSources = recordEntries.filter(
      ([source]) => !sourcesToIgnore || !sourcesToIgnore.includes(source),
    );
    if (
      recordEntriesWithoutIgnoredSources.length > 0 &&
      !recordEntriesWithoutIgnoredSources.some(
        ([source, recordForSource]) =>
          !sourcesToIgnore?.includes(source) && recordForSource.length > 0,
      )
    ) {
      result.push(normalizedAddress);
    }
  }

  return result;
};
