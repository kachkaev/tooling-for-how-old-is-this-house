import path from "node:path";
import hash from "object-hash";

import { getSourceDirPath } from "../sources";

export const getYandexGeocoderCacheDir = () =>
  path.resolve(getSourceDirPath("yandex"), "geocoder-cache");

export const getYandexGeocoderCacheEntryFileSuffix = () => "-entry.json";

export const getYandexGeocoderCacheEntryFilePath = (
  normalizedAddress: string,
): string => {
  const addressHash = hash(normalizedAddress.toLowerCase());

  return path.resolve(
    getYandexGeocoderCacheDir(),
    addressHash.slice(0, 2),
    addressHash.slice(2, 4),
    `${addressHash.slice(4, 12)}${getYandexGeocoderCacheEntryFileSuffix()}`,
  );
};
