import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";

import { deepClean } from "../deep-clean";
import { serializeTime } from "../helpers-for-json";
import { normalizeSpacing } from "../normalize-spacing";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
} from "../output-layers";
import { processFiles } from "../process-files";
import { getTerritoryConfig, getTerritoryExtent } from "../territory";
import { getMkrfObjectDirPath } from "./helpers-for-paths";
import { MkrfObjectFile } from "./types";

const extractName = (name: string | undefined): string | undefined => {
  if (!name?.length) {
    return undefined;
  }

  const lowerCaseName = normalizeSpacing(name.toLowerCase());

  if (lowerCaseName === "дом") {
    return undefined;
  }

  if (lowerCaseName.includes("дом") && lowerCaseName.includes("жилой")) {
    return undefined;
  }

  // Remove trivial names like “дом № 1 по улице Такой-то”
  if (/^дом (№ )?(\S+) по /.test(lowerCaseName)) {
    return undefined;
  }

  return name;
};

const wordsToCheckInHistoricMonuments = [
  "дом",
  "здание",

  "мечеть",
  "собор",
  "храм",
  "церковь",
  "часовня",

  "башня",
  "ворота",
  "застава",
  "усадьба",
  "флигель",
];
const acceptedTypologies = new Set([
  "памятник градостроительства и архитектуры",
  ...wordsToCheckInHistoricMonuments.map(
    (wordToCheck) => `памятник истории (+ слово «${wordToCheck}»)`,
  ),
]);

const isTypologyExpected = (typologyValue: string) =>
  acceptedTypologies.has(typologyValue);

const deriveTypologies = (objectFile: MkrfObjectFile): string[] => {
  const rawTypologies = (objectFile.data.general.typologies ?? []).map(
    (typologyEntry) => typologyEntry.value.toLowerCase(),
  );

  const typologies = rawTypologies.map((rawTypology) => {
    if (rawTypology === "памятник истории") {
      for (const wordToCheck of wordsToCheckInHistoricMonuments) {
        if (
          objectFile.nativeName.toLowerCase().includes(wordToCheck) ||
          objectFile.data.general.securityInfo
            ?.toLowerCase()
            .includes(wordToCheck)
        ) {
          return `памятник истории (+ слово «${wordToCheck}»)`;
        }
      }
    }

    return rawTypology;
  });

  return typologies;
};
export const generateMkrfOutputLayer: GenerateOutputLayer = async ({
  output,
  geocodeAddress,
}) => {
  const outputFeatures: OutputLayer["features"] = [];
  const territoryConfig = await getTerritoryConfig();
  const territoryCentroid = turf.centroid(await getTerritoryExtent());

  await processFiles({
    output,
    fileSearchDirPath: getMkrfObjectDirPath(),
    fileSearchPattern: "*--info.json",
    filesNicknameToLog: "mkrf object info files",
    processFile: async (filePath, prefixLength) => {
      const prefix = `${" ".repeat(prefixLength + 1)}`;
      const shouldNotProceedPrefix = chalk.gray(
        `${" ".repeat(prefixLength - 1)}• `,
      );
      const warningPrefix = chalk.yellow(`${" ".repeat(prefixLength - 1)}! `);

      const objectFile = (await fs.readJson(filePath)) as MkrfObjectFile;
      output?.write(`${prefix}${objectFile.nativeName}\n`);

      // Filter by typology
      const typologies = deriveTypologies(objectFile);
      const hasRightTypology = typologies.some((typology) =>
        isTypologyExpected(typology),
      );
      output?.write(
        `${hasRightTypology ? prefix : shouldNotProceedPrefix}${
          typologies
            .map((value) => {
              const color = isTypologyExpected(value) ? chalk.cyan : chalk.gray;

              return color(value);
            })
            .join(", ") || chalk.gray("no typology types found")
        }\n`,
      );

      if (!hasRightTypology) {
        output?.write("\n");

        return;
      }

      // Address
      const address = objectFile.data.general.address?.fullAddress;
      if (address) {
        output?.write(`${prefix}${chalk.cyan(address)}\n`);
      } else {
        output?.write(`${warningPrefix}${chalk.yellow("No address")}\n`);
      }

      // Id
      const id = objectFile.nativeId;

      // Coordinates
      let point: turf.Point | undefined;
      let pointSource: string = "unknown";
      let externalGeometrySource: string | undefined;

      const fixedLonLat = territoryConfig.sources?.mkrf?.fixedLonLatById?.[id];
      if (
        typeof fixedLonLat?.[0] === "number" &&
        typeof fixedLonLat[1] === "number"
      ) {
        point = { type: "Point", coordinates: fixedLonLat };
        pointSource = "territory config";
        externalGeometrySource = "territory-config";
      }

      const mapPosition = objectFile.data.general.address?.mapPosition;
      if (!point && mapPosition) {
        point = mapPosition;
        pointSource = "object info";
      }

      const additionalCoordinates =
        objectFile.data.general.additionalCoordinates;
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
        output?.write(
          `${prefix}${chalk.cyan(
            `[${point.coordinates.join(", ")}]`,
          )} (${pointSource})\n`,
        );
      }

      if (!address && !point) {
        output?.write(
          chalk.gray(
            `${shouldNotProceedPrefix}no coordinates and no address\n`,
          ),
        );
        output?.write("\n");

        return;
      }

      const completionTime = objectFile.data.general.createDate;

      const name = extractName(objectFile.nativeName);

      // Combined properties
      const outputLayerProperties: OutputLayerProperties = deepClean({
        id,

        address,
        completionTime,
        externalGeometrySource,
        knownAt: serializeTime(objectFile.modified),
        mkrfUrl: `https://opendata.mkrf.ru/opendata/7705851331-egrkn/50/${objectFile.nativeId}`,
        name,
        photoUrl: objectFile.data.general.photo?.url,
      });

      outputFeatures.push(turf.feature(point, outputLayerProperties));

      if (!point && geocodeAddress) {
        output?.write(
          chalk.yellow(
            `${prefix}If the building still exists, please provide object coordinates via\n${prefix}territory-config.yml → sources → mkrf → fixedLonLatById → ${id}: [lon, lat]\n`,
          ),
        );
      }

      output?.write("\n");
    },
  });

  return {
    type: "FeatureCollection",
    layerRole: "patch",
    features: outputFeatures,
  };
};
