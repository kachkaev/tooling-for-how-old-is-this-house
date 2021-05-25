import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";

import { deepClean } from "../../deepClean";
import { serializeTime } from "../../helpersForJson";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
} from "../../outputLayers";
import { processFiles } from "../../processFiles";
import { getTerritoryExtent } from "../../territory";
import { getMkrfObjectDirPath } from "./helpersForPaths";
import { MkrfObjectFile } from "./types";

const extractName = (nativeName: string | undefined): string | undefined => {
  const trimmedName = (nativeName ?? "").trim();
  if (!trimmedName.length) {
    return undefined;
  }

  const lowerCaseName = trimmedName.toLowerCase();

  if (lowerCaseName === "дом") {
    return undefined;
  }

  if (lowerCaseName.includes("дом") && lowerCaseName.includes("жилой")) {
    return undefined;
  }

  return trimmedName;
};

const acceptedTypologies = ["памятник градостроительства и архитектуры"];
const isTypologyExpected = (typologyValue: string) =>
  acceptedTypologies.includes(typologyValue);

export const generateMkrfOutputLayer: GenerateOutputLayer = async ({
  logger,
  geocodeAddress,
}) => {
  const outputFeatures: OutputLayer["features"] = [];
  const territoryCentroid = turf.centroid(await getTerritoryExtent());

  await processFiles({
    logger,
    fileSearchDirPath: getMkrfObjectDirPath(),
    fileSearchPattern: "*--info.json",
    filesNicknameToLog: "mkrf object info files",
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
      const address = objectFile.data?.general?.address?.fullAddress;
      if (address) {
        logger?.log(`${prefix}${chalk.cyan(address)}`);
      } else {
        logger?.log(`${warningPrefix}${chalk.yellow("No address")}`);
      }

      // Coordinates
      const mapPosition = objectFile.data.general.address?.mapPosition;
      let point = mapPosition;
      let pointSource = "map position";
      let externalGeometrySource: string | undefined = undefined;

      const additionalCoordinates =
        objectFile.data.general?.additionalCoordinates;
      if (!point && additionalCoordinates) {
        try {
          point = turf.centerOfMass(additionalCoordinates).geometry;
        } catch {
          try {
            point = turf.centroid(additionalCoordinates[0]!).geometry;
          } catch {
            // noop
          }
        }
        pointSource = "additional";
      }

      // additionalCoordinates can be in [lon,lat] instead of [lat,lon], so flipping if possible
      if (point && point.coordinates[1] && point.coordinates[0]) {
        const distance = turf.distance(point, territoryCentroid);
        const flippedPoint: turf.Point = {
          type: "Point",
          coordinates: [point.coordinates[1], point.coordinates[0]],
        };
        const flippedDistance = turf.distance(flippedPoint, territoryCentroid);
        if (flippedDistance < distance) {
          point = flippedPoint;
        }
      }

      if (!point && address && geocodeAddress) {
        const geocodeResult = geocodeAddress(address);
        if (geocodeResult) {
          point = geocodeResult.location;
          externalGeometrySource = geocodeResult.source;
          pointSource = `geocodes: ${externalGeometrySource}`;
        }
      }

      // Round coordinates
      if (point) {
        point = turf.truncate(point, { precision: 6 });
      }

      if (point) {
        logger?.log(
          `${prefix}${chalk.cyan(
            `[${point.coordinates.join(", ")}]`,
          )} (${pointSource})`,
        );
      }

      if (!address && !point) {
        logger?.log(
          chalk.gray(`${shouldNotProceedPrefix}no coordinates and no address`),
        );
        logger?.log("");

        return;
      }

      const completionDates = objectFile?.data.general.createDate;

      const name = extractName(objectFile?.nativeName);

      // Combined properties
      const outputLayerProperties: OutputLayerProperties = {
        id: objectFile.nativeId,

        address,
        completionDates,
        externalGeometrySource,
        knownAt: serializeTime(objectFile.modified),
        name,
        photoUrl: objectFile.data?.general?.photo?.url,
      };

      outputFeatures.push(
        turf.feature(point, deepClean(outputLayerProperties)),
      );
      logger?.log("");
    },
  });

  return {
    type: "FeatureCollection",
    layerRole: "patch",
    features: outputFeatures,
  };
};
