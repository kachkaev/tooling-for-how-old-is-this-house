import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import axios, { AxiosError, AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";
import http from "http";
import https from "https";

import { cleanEnv } from "../../../shared/cleanEnv";
import {
  listNormalizedAddressesWithoutPosition,
  loadCombinedGeocodeDictionary,
} from "../../../shared/geocoding";
import {
  addBufferToBbox,
  roughenBbox,
} from "../../../shared/helpersForGeometry";
import {
  serializeTime,
  writeFormattedJson,
} from "../../../shared/helpersForJson";
import {
  addressIsWorthGeocodingWithYandex,
  getYandexGeocoderCacheEntryFilePath,
  YandexGeocoderCacheEntry,
} from "../../../shared/sources/yandex";
import {
  getTerritoryAddressHandlingConfig,
  getTerritoryExtent,
} from "../../../shared/territory";

export const createAxiosInstanceForYandexGeocoder = (): AxiosInstance => {
  const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
  });

  axiosRetry(axiosInstance, {
    retries: 5,
    retryDelay: (retryCount) => (retryCount - 1) * 500,
    shouldResetTimeout: true,
  });

  return axiosInstance;
};

export const geocodeAddressesWithoutPosition: Command = async ({ logger }) => {
  logger.log(
    chalk.bold(`sources/yandex: Geocoding addresses without position`),
  );

  process.stdout.write(
    chalk.green("Listing normalized addresses without position..."),
  );
  const normalizedAddresses = listNormalizedAddressesWithoutPosition({
    combinedGeocodeDictionary: await loadCombinedGeocodeDictionary(),
    sourcesToIgnore: ["yandex"],
  });
  process.stdout.write(` Found ${normalizedAddresses.length}.\n`);

  process.stdout.write(chalk.green("Filtering..."));

  const addressHandlingConfig = await getTerritoryAddressHandlingConfig(logger);
  const filteredNormalizedAddresses = normalizedAddresses.filter(
    (normalizedAddress) =>
      addressIsWorthGeocodingWithYandex(
        normalizedAddress,
        addressHandlingConfig,
      ),
  );

  process.stdout.write(
    ` Found ${filteredNormalizedAddresses.length} that can be geocoded by Yandex.\n`,
  );

  const apiKey = cleanEnv({
    YANDEX_GEOCODER_API_KEY: envalid.str({
      desc: "API key from https://developer.tech.yandex.ru (see README.md)",
      example: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    }),
  }).YANDEX_GEOCODER_API_KEY;

  const searchBbox = roughenBbox(
    addBufferToBbox(turf.bbox(await getTerritoryExtent()), 100),
    4,
  );

  // https://yandex.ru/dev/maps/geocoder/doc/desc/concepts/input_params.html
  const sharedRequestParams = {
    apikey: apiKey,
    rspn: "1",
    bbox: `${searchBbox[0]},${searchBbox[1]}~${searchBbox[2]},${searchBbox[3]}`,
    kind: "house",
    format: "json",
    results: "1",
  };

  const axiosInstance = createAxiosInstanceForYandexGeocoder();

  let numberOfPreExistingCacheEntries = 0;
  let numberOfUpdatedCacheEntries = 0;
  for (const normalizedAddress of filteredNormalizedAddresses) {
    const cacheEntryFilePath = getYandexGeocoderCacheEntryFilePath(
      normalizedAddress,
    );
    if (await fs.pathExists(cacheEntryFilePath)) {
      numberOfPreExistingCacheEntries += 1;

      continue;
    }

    try {
      const apiResponse = await axiosInstance.get(
        "https://geocode-maps.yandex.ru/1.x",
        { params: { ...sharedRequestParams, geocode: normalizedAddress } },
      );

      const cacheEntry: YandexGeocoderCacheEntry = {
        normalizedAddress,
        fetchedAt: serializeTime(),
        data: apiResponse.data,
      };
      await writeFormattedJson(cacheEntryFilePath, cacheEntry);
      numberOfUpdatedCacheEntries += 1;
      logger.log(`${chalk.magenta(cacheEntryFilePath)} ${normalizedAddress}`);
    } catch (e: unknown) {
      if ((e as AxiosError)?.response?.status === 403) {
        logger.log(
          chalk.red(
            "Looks like you’ve reached your API key limits. Try again tomorrow!",
          ),
        );
      } else {
        logger.log(e);
      }
      break;
    }
  }

  logger.log(
    `Done. Updated cache entries: ${numberOfUpdatedCacheEntries}, pre-existing cache entries: ${numberOfPreExistingCacheEntries}.`,
  );
};

autoStartCommandIfNeeded(geocodeAddressesWithoutPosition, __filename);
