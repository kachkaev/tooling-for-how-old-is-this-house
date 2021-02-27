import * as turf from "@turf/turf";
// import chalk from "chalk";
import fs from "fs-extra";

import { deepClean } from "../../deepClean";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
  // OutputLayerProperties,
} from "../../output";
import { processFiles } from "../../processFiles";
import { getRegionExtent } from "../../region";
import { combineRosreestrTiles } from "./combineRosreestrTiles";
import { getObjectInfoPagesDirPath } from "./helpersForPaths";
import { InfoPageData, ObjectCenterFeature } from "./types";

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
        const cn = infoPageEntry.cn;
        if (
          typeof infoPageEntry.firResponse !== "object" ||
          !infoPageEntry.firFetchedAt
        ) {
          continue;
        }

        // Geometry
        const { geometry } = objectCenterFeatureByCn[cn] ?? {};
        if (geometry) {
          cnsWithGeometrySet.add(cn);
        }

        if (
          infoPageEntry.firResponse.parcelData.oksFlag !== 1 ||
          infoPageEntry.firResponse.parcelData.oksType !== "building"
        ) {
          continue;
        }

        // Combined properties
        const outputLayerProperties: OutputLayerProperties = {
          id: cn,
          knownAt: infoPageEntry.firFetchedAt,
        };

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

  logger?.log({
    l: objectCenterFeatures.length,
    lInside: objectCenterFeaturesInsideRegion.length,
    lu: Object.keys(objectCenterFeatureByCn).length,
    l2: outputFeatures.length,
    l3: cnsWithGeometrySet.size,
    unused: unusedCnsWithGeometry,
  });
  // const { objectExtentFeatures } = await combineWikimapiaTiles({ logger });

  // for (const objectFeature of objectExtentFeatures) {
  //   const id = `${objectFeature.properties.wikimapiaId}`;
  //   const objectInfoFile = objectInfoFileById[id];
  //   if (!objectInfoFile) {
  //     logger?.log(chalk.yellow(`Could not find info for object ${id}`));
  //     continue;
  //   }

  //   const photos = objectInfoFile.data.photos;

  //   if (!photos?.length) {
  //     continue;
  //   }

  //   const areaInMeters = turf.area(objectFeature);
  //   if (areaInMeters > maxAreaInMeters || areaInMeters < minAreaInMeters) {
  //     continue;
  //   }
  //   // Excludes 'long' features such as streets
  //   const perimeterInMeters =
  //     turf.length(turf.polygonToLine(objectFeature)) * 1000;
  //   if (perimeterInMeters > maxPerimeterInMeters) {
  //     continue;
  //   }

  //   const perimeterToAreaSqrtRatio =
  //     perimeterInMeters / Math.sqrt(areaInMeters);
  //   if (perimeterToAreaSqrtRatio > maxPerimeterToAreaSqrtRatio) {
  //     continue;
  //   }

  //   const mostRecentPhotoInfo = photos[photos.length - 1]!;

  return turf.featureCollection(outputFeatures);
};
