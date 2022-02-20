import * as turf from "@turf/turf";
import fs from "fs-extra";
import _ from "lodash";

import {
  AddressHandlingConfig,
  AddressNormalizationConfig,
  buildCleanedAddressAst,
  buildStandardizedAddressAst,
} from "../addresses";
import { deepClean } from "../deep-clean";
import { normalizeSpacing } from "../normalize-spacing";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
} from "../output-layers";
import { processFiles } from "../process-files";
import {
  getTerritoryAddressHandlingConfig,
  getTerritoryExtent,
} from "../territory";
import { combineRosreestrTiles } from "./combine-rosreestr-tiles";
import {
  checkIfFirResponseContainsExistingBuilding,
  extractCompletionTimeFromFirResponse,
  extractDocumentedBuildAreaFromFirResponse,
} from "./helpers-for-api-responses";
import { normalizeCnForSorting } from "./helpers-for-cn";
import { getObjectInfoPagesDirPath } from "./helpers-for-paths";
import { InfoPageData, InfoPageObject, ObjectCenterFeature } from "./types";
import { validateCyrillic } from "./validate-cyrillic";

export const calculateFloorCounts = (
  rawFloorCountTotal: string | undefined,
  rawFloorCountBelowGround: string | undefined,
): {
  floorCountAboveGround?: number | undefined;
  floorCountBelowGround?: number | undefined;
} => {
  const floorCountsTotal = rawFloorCountTotal?.split("-") ?? []; // Needed to support "1-2"
  const floorCountTotal = Number.parseInt(
    floorCountsTotal[floorCountsTotal.length - 1] ?? "",
  );
  const floorCountBelowGround = Number.parseInt(
    (rawFloorCountBelowGround === "-" ? "0" : rawFloorCountBelowGround) ?? "",
  );

  if (!Number.isFinite(floorCountTotal)) {
    return {};
  }

  return {
    floorCountAboveGround: floorCountTotal - (floorCountBelowGround || 0),
    floorCountBelowGround,
  };
};

const processCompletionTime = (completionTime: string | undefined) => {
  const result = normalizeSpacing(completionTime ?? "")
    .toLowerCase()
    .replace(/^1917$/, "до 1917");

  if (!result) {
    return;
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

  const addressesToPickFrom =
    standardizableAddresses.length > 0
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

  return deepClean({
    id: cn,
    knownAt: firFetchedAt,
    completionTime: processCompletionTime(
      extractCompletionTimeFromFirResponse(firResponse),
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
  });
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

  const rawYear: number | string | undefined =
    attrs.year_built ?? attrs.year_used;

  const completionTime = processCompletionTime(
    rawYear ? `${rawYear}` : undefined,
  );

  const documentedBuildArea =
    attrs.area_dev_unit === "055"
      ? attrs.area_dev
      : attrs.area_unit === "055" && attrs.floors === "1"
      ? attrs.area_value
      : undefined;

  return deepClean({
    id: cn,
    knownAt: pkkFetchedAt,
    documentedBuildArea,
    address: attrs.address,
    completionTime,
    ...calculateFloorCounts(attrs.floors, attrs.underground_floors),
  });
};

export const generateRosreestrOutputLayer: GenerateOutputLayer = async ({
  output,
  geocodeAddress,
}) => {
  const territoryExtent = await getTerritoryExtent();
  const addressHandlingConfig = await getTerritoryAddressHandlingConfig(output);

  const { objectCenterFeatures } = await combineRosreestrTiles({
    output,
    objectType: "cco",
  });

  const objectCenterFeaturesInsideTerritory = objectCenterFeatures.filter(
    ({ geometry }) => turf.booleanPointInPolygon(geometry, territoryExtent),
  );

  const objectCenterFeatureByCn: Record<string, ObjectCenterFeature> = {};
  for (const objectCenterFeature of objectCenterFeaturesInsideTerritory) {
    objectCenterFeatureByCn[objectCenterFeature.properties.cn] =
      objectCenterFeature;
  }

  const outputFeatures: OutputLayer["features"] = [];
  await processFiles({
    output,
    fileSearchDirPath: getObjectInfoPagesDirPath(),
    fileSearchPattern: "**/page-*.json",
    filesNicknameToLog: "rosreestr info pages",
    processFile: async (filePath) => {
      const infoPageData = (await fs.readJson(filePath)) as InfoPageData;
      for (const infoPageEntry of infoPageData) {
        const propertyVariants = [
          extractPropertiesFromFirResponse(
            infoPageEntry,
            addressHandlingConfig,
          ),
          extractPropertiesFromPkkResponse(infoPageEntry),
        ]
          .filter((variant) => typeof variant === "object")
          .reverse();

        if (propertyVariants.length === 0) {
          continue;
        }

        const outputLayerProperties = Object.assign(
          {},
          ...propertyVariants,
        ) as OutputLayerProperties;

        const cn = infoPageEntry.cn;
        let geometry: turf.Point | undefined =
          objectCenterFeatureByCn[cn]?.geometry;

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
