import { WriteStream } from "node:tty";

import { loadGeocodeDictionaryLookup } from "./loadGeocodeDictionaryLookup";
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
