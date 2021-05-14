import * as turf from "@turf/turf";
import fs from "fs-extra";
import _ from "lodash";

import {
  buildCleanedAddressAst,
  buildStandardizedAddressAst,
} from "../../addresses";
import { deepClean } from "../../deepClean";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
} from "../../output";
import { processFiles } from "../../processFiles";
import { getTerritoryExtent } from "../../territory";
import { combineRosreestrTiles } from "./combineRosreestrTiles";
import { normalizeCnForSorting } from "./helpersForCn";
import { getObjectInfoPagesDirPath } from "./helpersForPaths";
import { InfoPageData, InfoPageObject, ObjectCenterFeature } from "./types";
import { validateCyrillic } from "./validateCyrillic";

const pickMostPromisingAddress = (
  ...rawAddresses: Array<string | undefined>
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
      buildStandardizedAddressAst(buildCleanedAddressAst(rawAddress));
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
): OutputLayerProperties | "notBuilding" | undefined => {
  const { cn, firResponse, firFetchedAt } = infoPageObject;
  if (typeof firResponse !== "object" || !firFetchedAt) {
    return;
  }

  if (firResponse.parcelData.oksType !== "building") {
    return "notBuilding";
  }

  const completionDates =
    firResponse.parcelData.oksYearBuilt ?? firResponse.parcelData.oksYearUsed;

  return {
    id: cn,
    knownAt: firFetchedAt,
    completionDates,
    address: pickMostPromisingAddress(
      firResponse.objectData.objectAddress?.mergedAddress,
      firResponse.objectData.addressNote,
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

  if (pkkResponse.attrs.oks_type !== "building") {
    return "notBuilding";
  }

  const completionDates =
    pkkResponse.attrs.year_built ||
    (pkkResponse.attrs.year_used
      ? `${pkkResponse.attrs.year_used}`
      : undefined);

  return {
    id: cn,
    knownAt: pkkFetchedAt,
    address: pkkResponse.attrs.address,
    completionDates,
  };
};

export const generateRosreestrOutputLayer: GenerateOutputLayer = async ({
  logger,
  geocodeAddress,
}) => {
  const territoryExtent = await getTerritoryExtent();

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
        const outputLayerProperties =
          extractPropertiesFromFirResponse(infoPageEntry) ??
          extractPropertiesFromPkkResponse(infoPageEntry);

        if (!outputLayerProperties) {
          continue;
        }

        if (outputLayerProperties === "notBuilding") {
          continue;
        }

        const cn = infoPageEntry.cn;
        let geometry: turf.Point | undefined =
          objectCenterFeatureByCn[cn]?.geometry;
        // if (geometry) {
        //   cnsWithGeometrySet.add(cn);
        // }

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
    showFilePath: true,
  });

  return {
    type: "FeatureCollection",
    layerRole: "patch",
    features: _.sortBy(outputFeatures, (outputFeature) =>
      normalizeCnForSorting(outputFeature.properties.id),
    ),
  };
};
