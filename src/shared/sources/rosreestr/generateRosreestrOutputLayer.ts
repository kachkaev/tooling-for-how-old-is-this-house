import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";

import {
  buildCleanedAddressAst,
  buildStandardizedAddressAst,
  printCleanedAddressAst,
  printStandardizedAddressAst,
} from "../../addresses";
import { extractYearFromCompletionDates } from "../../completionDates";
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

type OutputLayerPropertiesWithRawAddress = Omit<
  OutputLayerProperties,
  "normalizedAddress"
> & { rawAddress?: string };

const extractPropertiesFromFirResponse = (
  infoPageObject: InfoPageObject,
): OutputLayerPropertiesWithRawAddress | "notBuilding" | undefined => {
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
    rawAddress:
      firResponse.objectData.objectAddress?.mergedAddress ??
      firResponse.objectData.addressNote,
    completionYear: extractYearFromCompletionDates(completionDates),
  };
};

const extractPropertiesFromPkkResponse = (
  infoPageObject: InfoPageObject,
): OutputLayerPropertiesWithRawAddress | "notBuilding" | undefined => {
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
    rawAddress: pkkResponse.attrs.address,
    completionDates,
    completionYear: extractYearFromCompletionDates(completionDates),
  };
};

export const generateRosreestrOutputLayer: GenerateOutputLayer = async ({
  logger,
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

  const originalSpellingsSet = new Set<string>();

  const normalizeAddress = (
    rawAddress: string | undefined,
  ): string | undefined => {
    if (!rawAddress) {
      return undefined;
    }
    const cleanedAddressAst = buildCleanedAddressAst(rawAddress);

    try {
      const standardizedAddressAst = buildStandardizedAddressAst(
        cleanedAddressAst,
      );

      return printStandardizedAddressAst(standardizedAddressAst);
    } catch {
      const cleanedAddress = printCleanedAddressAst(cleanedAddressAst);
      if (
        !cleanedAddress.includes("ГАРАЖ") &&
        !cleanedAddress.includes("ГСК") &&
        !cleanedAddress.includes("ЗАРЕЧНЫЙ") &&
        !cleanedAddress.includes("ПЕНЗА") &&
        cleanedAddress.length > 5
      ) {
        logger?.log(rawAddress);
        logger?.log(chalk.yellow(cleanedAddress));
      }

      return cleanedAddress;
    }
  };

  const cnsWithGeometrySet = new Set<string>();
  const outputFeatures: OutputLayer["features"] = [];
  await processFiles({
    logger,
    fileSearchDirPath: getObjectInfoPagesDirPath(),
    fileSearchPattern: "**/page-*.json",
    processFile: async (filePath) => {
      const infoPageData: InfoPageData = await fs.readJson(filePath);
      for (const infoPageEntry of infoPageData) {
        const outputLayerPropertiesWithRawAddress =
          extractPropertiesFromFirResponse(infoPageEntry) ??
          extractPropertiesFromPkkResponse(infoPageEntry);

        if (!outputLayerPropertiesWithRawAddress) {
          continue;
        }

        const cn = infoPageEntry.cn;
        const { geometry } = objectCenterFeatureByCn[cn] ?? {};
        if (geometry) {
          cnsWithGeometrySet.add(cn);
        }

        if (outputLayerPropertiesWithRawAddress === "notBuilding") {
          continue;
        }

        const {
          rawAddress,
          ...otherProperties
        } = outputLayerPropertiesWithRawAddress;

        const normalizedAddress = normalizeAddress(rawAddress);

        const outputLayerProperties: OutputLayerProperties = {
          ...otherProperties,
          normalizedAddress,
        };
        outputFeatures.push(
          turf.feature(geometry, deepClean(outputLayerProperties)),
        );
      }
    },
    statusReportFrequency: 1000,
    showFilePath: true,
  });

  const unusedCnsWithGeometry = objectCenterFeaturesInsideTerritory
    .map((f) => f.properties.cn)
    .filter((cn) => !cnsWithGeometrySet.has(cn))
    .sort();

  const unusedCnsWithGeometryInTerritory = unusedCnsWithGeometry.filter((cn) =>
    turf.booleanPointInPolygon(objectCenterFeatureByCn[cn]!, territoryExtent),
  );

  logger?.log({
    objectCenterFeatures: objectCenterFeatures.length,
    objectCenterFeaturesInsideTerritory:
      objectCenterFeaturesInsideTerritory.length,
    outputFeatures: outputFeatures.length,
    cnsWithGeometries: cnsWithGeometrySet.size,
    unusedCnsWithGeometry,
    unusedCnsWithGeometryInTerritory,
  });

  return {
    type: "FeatureCollection",
    layerRole: "patch",
    originalSpellings: [...originalSpellingsSet],
    features: _.sortBy(outputFeatures, (outputFeature) =>
      normalizeCnForSorting(outputFeature.properties.id),
    ),
  };
};
