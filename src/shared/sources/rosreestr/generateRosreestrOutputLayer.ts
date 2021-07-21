import * as turf from "@turf/turf";
import fs from "fs-extra";
import _ from "lodash";

import {
  AddressHandlingConfig,
  AddressNormalizationConfig,
  buildCleanedAddressAst,
  buildStandardizedAddressAst,
} from "../../addresses";
import { deepClean } from "../../deepClean";
import { normalizeSpacing } from "../../normalizeSpacing";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
} from "../../outputLayers";
import { processFiles } from "../../processFiles";
import {
  getTerritoryAddressHandlingConfig,
  getTerritoryExtent,
} from "../../territory";
import { combineRosreestrTiles } from "./combineRosreestrTiles";
import {
  checkIfFirResponseContainsExistingBuilding,
  extractCompletionDatesFromFirResponse,
  extractDocumentedBuildAreaFromFirResponse,
} from "./helpersForApiResponses";
import { normalizeCnForSorting } from "./helpersForCn";
import { getObjectInfoPagesDirPath } from "./helpersForPaths";
import { InfoPageData, InfoPageObject, ObjectCenterFeature } from "./types";
import { validateCyrillic } from "./validateCyrillic";

export const calculateFloorCounts = (
  rawFloorCountTotal: string | undefined,
  rawFloorCountBelowGround: string | undefined,
): {
  floorCountAboveGround?: number | undefined;
  floorCountBelowGround?: number | undefined;
} => {
  const floorCountsTotal = rawFloorCountTotal?.split("-") ?? []; // Needed to support "1-2"
  const floorCountTotal = parseInt(
    floorCountsTotal[floorCountsTotal.length - 1] ?? "",
  );
  const floorCountBelowGround = parseInt(
    (rawFloorCountBelowGround === "-" ? "0" : rawFloorCountBelowGround) ?? "",
  );

  if (!isFinite(floorCountTotal)) {
    return {};
  }

  return {
    floorCountAboveGround: floorCountTotal - (floorCountBelowGround || 0),
    floorCountBelowGround,
  };
};

const processCompletionDates = (completionDates: string | undefined) => {
  const result = normalizeSpacing(completionDates ?? "")
    .toLowerCase()
    .replace(/^1917$/, "до 1917");

  if (!result) {
    return undefined;
  }

  return result;
};

const pickMostPromisingAddress = (
  rawAddresses: Array<string | undefined>,
  addressNormalizationConfig: AddressNormalizationConfig,
): string | undefined => {
  const definedAddresses: string[] = rawAddresses.filter(
    (rawAddress): rawAddress is string =>
      typeof rawAddress === "string" && validateCyrillic(rawAddress),
  );

  if (definedAddresses.length === 1) {
    return definedAddresses[0];
  }

  const standardizableAddresses = definedAddresses.filter((rawAddress) => {
    try {
      buildStandardizedAddressAst(
        buildCleanedAddressAst(rawAddress, addressNormalizationConfig),
        addressNormalizationConfig,
      );
    } catch {
      return false;
    }

    return true;
  });

  const addressesToPickFrom = standardizableAddresses.length
    ? standardizableAddresses
    : definedAddresses;

  return _.maxBy(addressesToPickFrom, (rawAddress) => rawAddress.length);
};

const extractPropertiesFromFirResponse = (
  infoPageObject: InfoPageObject,
  addressHandlingConfig: AddressHandlingConfig,
): OutputLayerProperties | "notBuilding" | undefined => {
  const { cn, firResponse, firFetchedAt } = infoPageObject;
  if (typeof firResponse !== "object" || !firFetchedAt) {
    return;
  }

  if (!checkIfFirResponseContainsExistingBuilding(firResponse)) {
    return "notBuilding";
  }

  return {
    id: cn,
    knownAt: firFetchedAt,
    completionDates: processCompletionDates(
      extractCompletionDatesFromFirResponse(firResponse),
    ),
    documentedBuildArea: extractDocumentedBuildAreaFromFirResponse(firResponse),
    address: pickMostPromisingAddress(
      [
        firResponse.objectData.objectAddress?.mergedAddress,
        firResponse.objectData.addressNote,
      ],
      addressHandlingConfig,
    ),
    ...calculateFloorCounts(
      firResponse.parcelData.oksFloors,
      firResponse.parcelData.oksUFloors,
    ),
  };
};

const extractPropertiesFromPkkResponse = (
  infoPageObject: InfoPageObject,
): OutputLayerProperties | "notBuilding" | undefined => {
  const { cn, pkkResponse, pkkFetchedAt } = infoPageObject;
  if (typeof pkkResponse !== "object" || !pkkFetchedAt) {
    return;
  }

  const attrs = pkkResponse.attrs;
  if (attrs.oks_type !== "building") {
    return "notBuilding";
  }

  const completionDates = processCompletionDates(
    attrs.year_built || (attrs.year_used ? `${attrs.year_used}` : undefined),
  );

  const documentedBuildArea =
    attrs.area_dev_unit === "055"
      ? attrs.area_dev
      : attrs.area_unit === "055" && attrs.floors === "1"
      ? attrs.area_value
      : undefined;

  return {
    id: cn,
    knownAt: pkkFetchedAt,
    documentedBuildArea,
    address: attrs.address,
    completionDates,
    ...calculateFloorCounts(attrs.floors, attrs.underground_floors),
  };
};

export const generateRosreestrOutputLayer: GenerateOutputLayer = async ({
  logger,
  geocodeAddress,
}) => {
  const territoryExtent = await getTerritoryExtent();
  const addressHandlingConfig = await getTerritoryAddressHandlingConfig(logger);

  const { objectCenterFeatures } = await combineRosreestrTiles({
    logger,
    objectType: "cco",
  });

  const objectCenterFeaturesInsideTerritory = objectCenterFeatures.filter(
    ({ geometry }) => turf.booleanPointInPolygon(geometry, territoryExtent),
  );

  const objectCenterFeatureByCn: Record<string, ObjectCenterFeature> = {};
  for (const objectCenterFeature of objectCenterFeaturesInsideTerritory) {
    objectCenterFeatureByCn[
      objectCenterFeature.properties.cn
    ] = objectCenterFeature;
  }

  const outputFeatures: OutputLayer["features"] = [];
  await processFiles({
    logger,
    fileSearchDirPath: getObjectInfoPagesDirPath(),
    fileSearchPattern: "**/page-*.json",
    filesNicknameToLog: "rosreestr info pages",
    processFile: async (filePath) => {
      const infoPageData: InfoPageData = await fs.readJson(filePath);
      for (const infoPageEntry of infoPageData) {
        const propertyVariants = [
          extractPropertiesFromFirResponse(
            infoPageEntry,
            addressHandlingConfig,
          ),
          extractPropertiesFromPkkResponse(infoPageEntry),
        ]
          .filter((variant) => typeof variant === "object")
          .map((variant) => deepClean(variant))
          .reverse();

        if (!propertyVariants.length) {
          continue;
        }

        const outputLayerProperties: OutputLayerProperties = Object.assign(
          {},
          ...propertyVariants,
        );

        const cn = infoPageEntry.cn;
        let geometry: turf.Point | null =
          objectCenterFeatureByCn[cn]?.geometry ?? null;

        if (!geometry && outputLayerProperties.address && geocodeAddress) {
          const geocodeResult = geocodeAddress(outputLayerProperties.address);
          if (geocodeResult?.location) {
            geometry = geocodeResult.location;
            outputLayerProperties.externalGeometrySource = geocodeResult.source;
          }
        }

        outputFeatures.push(
          turf.feature(geometry, deepClean(outputLayerProperties)),
        );
      }
    },
    statusReportFrequency: 1000,
  });

  return {
    type: "FeatureCollection",
    layerRole: "patch",
    features: _.sortBy(outputFeatures, (outputFeature) =>
      normalizeCnForSorting(outputFeature.properties.id ?? ""),
    ),
  };
};
