import { AddressNormalizationConfig, normalizeAddress } from "../addresses";
import { GeocodeAddressResult, GeocodeDictionary } from "./types";

export const geocodeAddress = (
  address: string,
  addressNormalizationConfig: AddressNormalizationConfig,
  combinedGeocodeDictionary: GeocodeDictionary,
  sourcesInPriorityOrder: string[],
): GeocodeAddressResult => {
  const normalizedAddress = normalizeAddress(
    address,
    addressNormalizationConfig,
  );

  const addressRecord = combinedGeocodeDictionary[normalizedAddress ?? ""];
  if (!addressRecord) {
    return undefined;
  }

  for (const source of sourcesInPriorityOrder) {
    const sourceRecord = addressRecord[source];
    if (sourceRecord && sourceRecord.length) {
      return {
        source,
        location: {
          type: "Point",
          coordinates: [sourceRecord[0], sourceRecord[1]],
        },
        knownAt: sourceRecord[2],
      };
    }
  }

  return undefined;
};
