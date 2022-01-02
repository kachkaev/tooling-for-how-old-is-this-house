import {
  AddressNormalizationConfig,
  normalizeAddressAtomically,
} from "../addresses";
import { postProcessWordsInStandardizedAddressSection } from "./postProcessWordsInStandardizedAddressSection";
import { GeocodeAddressResult, GeocodeDictionary } from "./types";

export const geocodeAddress = (
  address: string,
  addressNormalizationConfig: AddressNormalizationConfig,
  combinedGeocodeDictionary: GeocodeDictionary,
  sourcesInPriorityOrder: string[],
): GeocodeAddressResult => {
  const normalizedAddresses = normalizeAddressAtomically(
    address,
    addressNormalizationConfig,
    postProcessWordsInStandardizedAddressSection,
  );

  for (const normalizedAddress of normalizedAddresses) {
    const addressRecord = combinedGeocodeDictionary[normalizedAddress];
    if (!addressRecord) {
      return undefined;
    }

    for (const source of sourcesInPriorityOrder) {
      const sourceRecord = addressRecord[source];
      if (sourceRecord && sourceRecord.length === 2) {
        return {
          source,
          location: {
            type: "Point",
            coordinates: [sourceRecord[0], sourceRecord[1]],
          },
        };
      }
    }
  }

  return undefined;
};
