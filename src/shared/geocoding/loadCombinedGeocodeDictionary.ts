import { loadGeocodeDictionaryLookup } from "./loadGeocodeDictionaryLookup";
import { GeocodeDictionary } from "./types";

export const loadCombinedGeocodeDictionary = async (
  logger?: Console,
): Promise<GeocodeDictionary> => {
  const geocodeDictionaryLookup = await loadGeocodeDictionaryLookup(logger);

  return Object.assign({}, ...Object.values(geocodeDictionaryLookup));
};
