import * as turf from "@turf/turf";
import fs from "fs-extra";
import _ from "lodash";

import { deepClean } from "../../deepClean";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
} from "../../output";
import { extractYearFromDates } from "../../output/parseYear";
import { processFiles } from "../../processFiles";
import { getRegionExtent } from "../../region";
import { combineRosreestrTiles } from "./combineRosreestrTiles";
import { normalizeCnForSorting } from "./helpersForCn";
import { getObjectInfoPagesDirPath } from "./helpersForPaths";
import { InfoPageData, InfoPageObject, ObjectCenterFeature } from "./types";

const normalizeRosreestrAddress = <T extends string | undefined>(
  address: T,
): T => {
  return address;
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

  const completionDates = firResponse.parcelData.oksYearBuilt;

  return {
    id: cn,
    knownAt: firFetchedAt,
    completionDates,
    normalizedAddress: normalizeRosreestrAddress(
      firResponse.objectData.objectAddress?.mergedAddress,
    ),
    completionYear: extractYearFromDates(completionDates),
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

  const completionDates = pkkResponse.attrs.year_built;

  return {
    id: cn,
    knownAt: pkkFetchedAt,
    normalizedAddress: normalizeRosreestrAddress(pkkResponse.attrs.address),
    completionDates,
    completionYear: extractYearFromDates(completionDates),
  };
};

export const generateRosreestrOutputLayer: GenerateOutputLayer = async ({
  logger,
}) => {
  const regionExtent = await getRegionExtent();

  const { objectCenterFeatures } = await combineRosreestrTiles({
    logger,
    objectType: "cco",
  });

  const objectCenterFeaturesInsideRegion = objectCenterFeatures.filter(
    ({ geometry }) => turf.booleanPointInPolygon(geometry, regionExtent),
  );

  const objectCenterFeatureByCn: Record<string, ObjectCenterFeature> = {};
  for (const objectCenterFeature of objectCenterFeaturesInsideRegion) {
    objectCenterFeatureByCn[
      objectCenterFeature.properties.cn
    ] = objectCenterFeature;
  }

  const cnsWithGeometrySet = new Set<string>();
  const outputFeatures: OutputLayer["features"] = [];
  await processFiles({
    logger,
    fileSearchDirPath: getObjectInfoPagesDirPath(),
    fileSearchPattern: "**/page-*.json",
    processFile: async (filePath) => {
      const infoPageData: InfoPageData = await fs.readJson(filePath);
      for (const infoPageEntry of infoPageData) {
        const outputLayerProperties =
          extractPropertiesFromFirResponse(infoPageEntry) ??
          extractPropertiesFromPkkResponse(infoPageEntry);

        if (!outputLayerProperties) {
          continue;
        }

        const cn = infoPageEntry.cn;
        const { geometry } = objectCenterFeatureByCn[cn] ?? {};
        if (geometry) {
          cnsWithGeometrySet.add(cn);
        }

        if (outputLayerProperties === "notBuilding") {
          continue;
        }

        outputFeatures.push(
          turf.feature(geometry, deepClean(outputLayerProperties)),
        );
      }
    },
    statusReportFrequency: 1000,
    showFilePath: true,
  });

  const unusedCnsWithGeometry = objectCenterFeaturesInsideRegion
    .map((f) => f.properties.cn)
    .filter((cn) => !cnsWithGeometrySet.has(cn))
    .sort();

  const unusedCnsWithGeometryInRegion = unusedCnsWithGeometry.filter((cn) =>
    turf.booleanPointInPolygon(objectCenterFeatureByCn[cn]!, regionExtent),
  );

  logger?.log({
    objectCenterFeatures: objectCenterFeatures.length,
    objectCenterFeaturesInsideRegion: objectCenterFeaturesInsideRegion.length,
    outputFeatures: outputFeatures.length,
    cnsWithGeometries: cnsWithGeometrySet.size,
    unusedCnsWithGeometry,
    unusedCnsWithGeometryInRegion,
  });

  return turf.featureCollection(
    _.sortBy(outputFeatures, (outputFeature) =>
      normalizeCnForSorting(outputFeature.properties.id),
    ),
  );
};
