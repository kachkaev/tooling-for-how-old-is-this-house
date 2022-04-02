import * as turf from "@turf/turf";
import axios, { AxiosError, AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";
import http from "node:http";
import https from "node:https";

import { cleanEnv } from "../../../shared/clean-env";
import {
  listNormalizedAddressesWithoutPosition,
  loadCombinedGeocodeDictionary,
} from "../../../shared/geocoding";
import {
  addBufferToBbox,
  roughenBbox,
} from "../../../shared/helpers-for-geometry";
import {
  serializeTime,
  writeFormattedJson,
} from "../../../shared/helpers-for-json";
import {
  addressIsWorthGeocodingWithYandex,
  getYandexGeocoderCacheEntryFilePath,
  YandexGeocoderCacheEntry,
  YandexGeocoderSuccessfulApiData,
} from "../../../shared/source-yandex";
import {
  getTerritoryAddressHandlingConfig,
  getTerritoryExtent,
} from "../../../shared/territory";

const output = process.stdout;

const createAxiosInstanceForYandexGeocoder = (): AxiosInstance => {
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

const script = async () => {
  output.write(
    chalk.bold(`sources/yandex: Geocoding addresses without position\n`),
  );

  output.write(chalk.green("Listing normalized addresses without position..."));
  const normalizedAddresses = listNormalizedAddressesWithoutPosition({
    combinedGeocodeDictionary: await loadCombinedGeocodeDictionary(),
    sourcesToIgnore: ["yandex"],
  });
  output.write(` Found ${normalizedAddresses.length}.\n`);

  output.write(chalk.green("Filtering..."));

  const addressHandlingConfig = await getTerritoryAddressHandlingConfig(output);
  const filteredNormalizedAddresses = normalizedAddresses.filter(
    (normalizedAddress) =>
      addressIsWorthGeocodingWithYandex(
        normalizedAddress,
        addressHandlingConfig,
      ),
  );

  output.write(
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
    const cacheEntryFilePath =
      getYandexGeocoderCacheEntryFilePath(normalizedAddress);
    if (await fs.pathExists(cacheEntryFilePath)) {
      numberOfPreExistingCacheEntries += 1;

      continue;
    }

    try {
      const apiResponse =
        await axiosInstance.get<YandexGeocoderSuccessfulApiData>(
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
      output.write(
        `${chalk.magenta(cacheEntryFilePath)} ${normalizedAddress}\n`,
      );
    } catch (error) {
      if ((error as AxiosError).response?.status === 403) {
        output.write(
          chalk.red(
            "Looks like you’ve reached your API key limits. Try again tomorrow!\n",
          ),
        );
      } else {
        output.write(`${String(error)}\n`);
      }
      break;
    }
  }

  output.write(
    `Done. Updated cache entries: ${numberOfUpdatedCacheEntries}, pre-existing cache entries: ${numberOfPreExistingCacheEntries}.\n`,
  );
};

await script();
