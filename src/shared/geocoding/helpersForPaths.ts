import path from "path";

import { splitAddress } from "../addresses";
import { gettTerritoryDirPath } from "../territory";

export const getGeocodeDictionariesDirPath = () => {
  return path.resolve(gettTerritoryDirPath(), "geocoding");
};

export const getGeocodeDictionaryFileName = () => "dictionary.json";

export const getDictionaryFilePath = (sliceId: string) => {
  return path.resolve(
    getGeocodeDictionariesDirPath(),
    sliceId,
    getGeocodeDictionaryFileName(),
  );
};

export const deriveNormalizedAddressSliceId = (
  normalizedAddress: string,
): string => {
  return splitAddress(normalizedAddress)
    .slice(0, 3)
    .map((slice) => slice.replace(/\//g, ""))
    .join("/");
};
