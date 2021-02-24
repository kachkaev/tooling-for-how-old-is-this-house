import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";

import {
  combineAddressParts,
  normalizeAddressPart,
  normalizeBuilding,
  normalizePlace,
  normalizeStreet,
  splitAddress,
} from "../../addresses";
import { deepClean } from "../../deepClean";
import { serializeTime } from "../../helpersForJson";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
} from "../../output";
import { extractYearFromDates } from "../../output/parseYear";
import { processFiles } from "../../processFiles";
import { getMkrfObjectDirPath } from "./helpersForPaths";
import { MkrfObjectFile } from "./types";

export const normalizeMkrfAddress = (address: string): string => {
  const addressParts = splitAddress(address);
  if (addressParts.length !== 4) {
    throw new Error(`Too many or too few address parts in "${address}"`);
  }
  const [rawRegion, rawPlace, rawStreet, rawBuilding] = addressParts;

  const region = normalizeAddressPart(rawRegion!);
  const place = normalizePlace(rawPlace!);
  const street = normalizeStreet(rawStreet!);
  const building = normalizeBuilding(rawBuilding!);

  return combineAddressParts(
    [region, place, street, building].map(normalizeAddressPart),
  );
};

const acceptedTypologies = ["памятник градостроительства и архитектуры"];
const isTypologyExpected = (typologyValue: string) =>
  acceptedTypologies.includes(typologyValue);

export const generateMkrfOutputLayer: GenerateOutputLayer = async ({
  logger,
  findPointForNormalizedAddress,
}) => {
  const outputFeatures: OutputLayer["features"] = [];

  await processFiles({
    logger,
    fileSearchDirPath: getMkrfObjectDirPath(),
    fileSearchPattern: "*--info.json",
    processFile: async (filePath, prefixLength) => {
      const prefix = `${" ".repeat(prefixLength + 1)}`;
      const shouldNotProceedPrefix = chalk.gray(
        `${" ".repeat(prefixLength - 1)}• `,
      );
      const warningPrefix = chalk.yellow(`${" ".repeat(prefixLength - 1)}! `);

      const objectFile: MkrfObjectFile = await fs.readJson(filePath);

      // Filter by typology
      const typologyValues = (
        objectFile.data.general.typologies ?? []
      ).map((typology) => typology.value.toLowerCase());

      const hasRightTypology = typologyValues.some(isTypologyExpected);

      logger?.log(
        `${hasRightTypology ? prefix : shouldNotProceedPrefix}${
          typologyValues
            .map((value) => {
              const color = isTypologyExpected(value) ? chalk.cyan : chalk.gray;

              return color(value);
            })
            .join(", ") || chalk.gray("no typology types found")
        }`,
      );

      if (!hasRightTypology) {
        logger?.log("");

        return;
      }

      // Address
      let normalizedAddress: string | undefined;
      try {
        const rawAddress = objectFile.data?.general?.address?.fullAddress;
        normalizedAddress = rawAddress
          ? normalizeMkrfAddress(rawAddress)
          : undefined;
        logger?.log(`${prefix}${chalk.cyan(normalizedAddress)}`);
      } catch (e) {
        logger?.log(`${warningPrefix}${chalk.yellow(e.message ?? e)}`);
      }

      // Coordinates
      const mapPosition = objectFile.data.general.address?.mapPosition;
      let point = mapPosition;
      let pointSource = "map position";

      const additionalCoordinates =
        objectFile.data.general?.additionalCoordinates;
      if (!point && additionalCoordinates) {
        point = turf.centerOfMass(additionalCoordinates).geometry;
        pointSource = "additional";
      }

      if (!point && normalizedAddress && findPointForNormalizedAddress) {
        point = findPointForNormalizedAddress(normalizedAddress);
        if (point) {
          pointSource = "geocodes";
        }
      }

      if (point) {
        logger?.log(
          `${prefix}${chalk.cyan(
            `[${point.coordinates.join(", ")}]`,
          )} (${pointSource})`,
        );
      }

      if (!normalizedAddress && !point) {
        logger?.log(
          chalk.gray(`${shouldNotProceedPrefix}no coordinates and no address`),
        );
        logger?.log("");

        return;
      }

      const completionDates = objectFile?.data.general.createDate;

      // Combined properties
      const outputLayerProperties: OutputLayerProperties = {
        id: objectFile.nativeId,
        name: objectFile?.data?.nativeName,
        completionDates,
        completionYear: completionDates
          ? extractYearFromDates(completionDates)
          : undefined,
        knownAt: serializeTime(objectFile.modified),
        normalizedAddress,
        photoUrl: objectFile.data?.general?.photo?.url,
      };

      outputFeatures.push(
        turf.feature(point, deepClean(outputLayerProperties)),
      );
      logger?.log("");
    },
    showFilePath: true,
  });

  return turf.featureCollection(outputFeatures);
};
