import { Coordinates, GeocodeDictionary } from "./types";

export const resolvePosition = async (
  combinedGeocodeDictionary: GeocodeDictionary,
  normalizedAddress: string,
  sourcesInPriorityOrder: string[],
): Promise<Coordinates | undefined> => {
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
