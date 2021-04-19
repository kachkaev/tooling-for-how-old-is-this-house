import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import chalk from "chalk";
import * as envalid from "envalid";
import http from "http";
import https from "https";

import { cleanEnv } from "../../../shared/cleanEnv";
import {
  listNormalizedAddressesWithoutPosition,
  loadCombinedGeocodeDictionary,
  ReportedGeocode,
  reportGeocodes,
} from "../../../shared/geocoding";
import {
  addBufferToBbox,
  roughenBbox,
} from "../../../shared/helpersForGeometry";
import { serializeTime } from "../../../shared/helpersForJson";
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

const saveEvery = 10;

export const geocodeAddressesWithoutPosition: Command = async ({ logger }) => {
  logger.log(chalk.bold("Geocoding addresses without position using yandex"));

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
  const normalizedAddresses = listNormalizedAddressesWithoutPosition(
    await loadCombinedGeocodeDictionary(),
  );
  process.stdout.write(` Found ${normalizedAddresses.length}.\n`);

  let unsavedGeocodes: ReportedGeocode[] = [];

  const saveUnsavedGeocodes = async () => {
    if (!unsavedGeocodes.length) {
      logger.log(chalk.gray(`No new geocodes to save.`));

      return;
    }

    process.stdout.write(
      chalk.green(
        `Saving ${unsavedGeocodes.length} reported geocode${
          unsavedGeocodes.length > 1 ? "s" : "s"
        }...`,
      ),
    );

    await reportGeocodes({
      reportedGeocodes: unsavedGeocodes,
      keepPrevious: true,
      source: "yandex",
    });
    unsavedGeocodes = [];
  };

  for (const normalizedAddress of normalizedAddresses) {
    try {
      const response = await axiosInstance.get(
        "https://geocode-maps.yandex.ru/1.x",
        { params: { ...sharedRequestParams, geocode: normalizedAddress } },
      );

      const rawCoordinates: string | undefined =
        response.data?.response?.GeoObjectCollection?.featureMember?.[0]
          ?.GeoObject?.Point?.pos;

      const coordinates = rawCoordinates
        ? (rawCoordinates.split(" ").map((n) => parseFloat(n)) as [
            number,
            number,
          ])
        : undefined;

      unsavedGeocodes.push({
        normalizedAddress,
        coordinates,
        knownAt: serializeTime(),
      });
    } catch (e) {
      logger.log(e);
      logger.log(
        chalk.red(
          "Looks like you’ve reached your API key limits. Try again tomorrow!",
        ),
      );
      break;
    }

    if (unsavedGeocodes.length === saveEvery) {
      await saveUnsavedGeocodes();
    }
  }

  await saveUnsavedGeocodes();

  process.stdout.write(chalk.magenta(` Done.\n`));
};

autoStartCommandIfNeeded(geocodeAddressesWithoutPosition, __filename);
