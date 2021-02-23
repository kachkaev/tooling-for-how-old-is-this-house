import { Coordinates, GeocodeDictionary } from "./types";

export const resolveCoordinates = (
  combinedGeocodeDictionary: GeocodeDictionary,
  normalizedAddress: string,
  sourcesInPriorityOrder: string[],
): Coordinates | undefined => {
  const addressRecord = combinedGeocodeDictionary[normalizedAddress];
  if (!addressRecord) {
    return undefined;
  }

  for (const source of sourcesInPriorityOrder) {
    const sourceRecord = addressRecord[source];
    if (sourceRecord && sourceRecord.length) {
      return [sourceRecord[0], sourceRecord[1]];
    }
  }

  return undefined;
};
