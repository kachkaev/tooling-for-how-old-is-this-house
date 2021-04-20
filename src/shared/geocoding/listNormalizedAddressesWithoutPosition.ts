import { GeocodeDictionary } from "./types";

export const listNormalizedAddressesWithoutPosition = ({
  combinedGeocodeDictionary,
  sourcesToIgnore,
}: {
  combinedGeocodeDictionary: GeocodeDictionary;
  sourcesToIgnore?: string[];
}): string[] => {
  const result: string[] = [];

  Object.entries(combinedGeocodeDictionary).forEach(
    ([normalizedAddress, recordForAddress]) => {
      if (
        !Object.entries(recordForAddress).find(
          ([source, recordForSource]) =>
            !sourcesToIgnore?.includes(source) && recordForSource.length > 0,
        )
      ) {
        result.push(normalizedAddress);
      }
    },
  );

  return result;
};
