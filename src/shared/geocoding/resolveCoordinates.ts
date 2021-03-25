import { Point2dCoordinates } from "../helpersForGeometry";
import { GeocodeDictionary } from "./types";

export const resolveCoordinates = (
  combinedGeocodeDictionary: GeocodeDictionary,
  normalizedAddress: string,
  sourcesInPriorityOrder: string[],
): Point2dCoordinates | undefined => {
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
