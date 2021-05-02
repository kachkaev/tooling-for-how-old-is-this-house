import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import axios, { AxiosError, AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";
import http from "http";
import https from "https";

import {
  buildCleanedAddressAst,
  buildStandardizedAddressAst,
} from "../../../shared/addresses";
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
  getYandexGeocoderCacheEntryFilePath,
  YandexGeocoderCacheEntry,
} from "../../../shared/sources/yandex";
import { getTerritoryExtent } from "../../../shared/territory";

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
    chalk.bold(`sources/yandex: geocoding addresses without position`),
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

  process.stdout.write(
    chalk.green("Listing normalized addresses without position..."),
  );
  const normalizedAddresses = listNormalizedAddressesWithoutPosition({
    combinedGeocodeDictionary: await loadCombinedGeocodeDictionary(),
    sourcesToIgnore: ["yandex"],
  });
  process.stdout.write(` Found ${normalizedAddresses.length}.\n`);

  for (const normalizedAddress of normalizedAddresses) {
    try {
      if (
        normalizedAddress.includes(" гараж ") ||
        normalizedAddress.includes(" место ") ||
        normalizedAddress.includes(" участок ") ||
        normalizedAddress.includes(" гск ") ||
        normalizedAddress.includes(" гск, ") ||
        normalizedAddress.includes(" проезд, ") ||
        normalizedAddress.includes(" улица, ") ||
        normalizedAddress.includes(" станция ") ||
        normalizedAddress.includes(" шоссе, ") ||
        normalizedAddress.includes(" снт, ") ||
        normalizedAddress.includes(" , 8 марта ") ||
        normalizedAddress.includes(" кооператив") ||
        normalizedAddress.includes(" снт ")
      ) {
        throw new Error("stop word");
      }
      buildStandardizedAddressAst(buildCleanedAddressAst(normalizedAddress));
    } catch {
      continue;
    }

    const cacheEntryFilePath = getYandexGeocoderCacheEntryFilePath(
      normalizedAddress,
    );
    if (await fs.pathExists(cacheEntryFilePath)) {
      logger.log(`${chalk.gray(cacheEntryFilePath)} ${normalizedAddress}`);
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
      logger.log(`${chalk.magenta(cacheEntryFilePath)} ${normalizedAddress}`);
    } catch (e: unknown) {
      if ((e as AxiosError)?.response?.status === 403) {
        logger.log(
          chalk.red(
            "Looks like you’ve reached your API key limits. Try again tomorrow!",
          ),
        );
      }
      logger.log(e);
      break;
    }
  }

  process.stdout.write(chalk.magenta(` Done.\n`));
};

autoStartCommandIfNeeded(geocodeAddressesWithoutPosition, __filename);
