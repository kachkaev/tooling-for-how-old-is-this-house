import { WriteStream } from "node:tty";

import { loadGeocodeDictionaryLookup } from "./load-geocode-dictionary-lookup";
import { GeocodeDictionary } from "./types";

export const loadCombinedGeocodeDictionary = async (
  output?: WriteStream,
): Promise<GeocodeDictionary> => {
  const geocodeDictionaryLookup = await loadGeocodeDictionaryLookup(output);

  return Object.assign(
    {},
    ...Object.values(geocodeDictionaryLookup),
  ) as GeocodeDictionary;
};
