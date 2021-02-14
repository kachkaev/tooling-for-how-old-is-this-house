import { GeocodeDictionary } from "./types";

export const listNormalizedAddressesWithoutPosition = (
  combinedGeocodeDictionary: GeocodeDictionary,
): string[] => {
  const result: string[] = [];

  Object.entries(combinedGeocodeDictionary).forEach(
    ([normalizedAddress, recordForAddress]) => {
      if (
        !Object.values(recordForAddress).find(
          (recordForSource) => recordForSource.length > 0,
        )
      ) {
        result.push(normalizedAddress);
      }
    },
  );

  return result;
};
