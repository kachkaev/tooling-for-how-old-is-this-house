import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";

import { deepClean } from "../../deepClean";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
} from "../../output";
import { processFiles } from "../../processFiles";
import { combineWikimapiaTiles } from "./combineWikimapiaTiles";
import {
  getWikimapiaObjectInfoFileSuffix,
  getWikimapiaObjectsDir,
} from "./helpersForPaths";
import { WikimapiaObjectInfoFile } from "./types";

const minAreaInMeters = 3;
const maxAreaInMeters = 50000;
const maxPerimeterInMeters = 2000;
const maxPerimeterToAreaSqrtRatio = 20;

export const generateWikimapiaOutputLayer: GenerateOutputLayer = async ({
  logger,
}) => {
  const outputFeatures: OutputLayer["features"] = [];

  const objectInfoFileById: Record<string, WikimapiaObjectInfoFile> = {};

  await processFiles({
    logger,
    fileSearchDirPath: getWikimapiaObjectsDir(),
    fileSearchPattern: `**/*-${getWikimapiaObjectInfoFileSuffix()}`,
    filesNicknameToLog: "wikimapia object info files",
    processFile: async (filePath) => {
      const objectInfoFile: WikimapiaObjectInfoFile = await fs.readJson(
        filePath,
      );

      objectInfoFileById[`${objectInfoFile.data.wikimapiaId}`] = objectInfoFile;
    },
    statusReportFrequency: 1000,
  });

  const { objectExtentFeatures } = await combineWikimapiaTiles({ logger });

  for (const objectFeature of objectExtentFeatures) {
    const id = `${objectFeature.properties.wikimapiaId}`;
    const objectInfoFile = objectInfoFileById[id];
    if (!objectInfoFile) {
      logger?.log(chalk.yellow(`Could not find info for object ${id}`));
      continue;
    }

    const areaInMeters = turf.area(objectFeature);
    if (areaInMeters > maxAreaInMeters || areaInMeters < minAreaInMeters) {
      continue;
    }
    // Excludes 'long' features such as streets
    const perimeterInMeters =
      turf.length(turf.polygonToLine(objectFeature)) * 1000;
    if (perimeterInMeters > maxPerimeterInMeters) {
      continue;
    }

    const perimeterToAreaSqrtRatio =
      perimeterInMeters / Math.sqrt(areaInMeters);
    if (perimeterToAreaSqrtRatio > maxPerimeterToAreaSqrtRatio) {
      continue;
    }

    const photos = objectInfoFile.data.photos;
    const mostRecentPhotoInfo = photos ? photos[photos.length - 1] : undefined;

    // Combined properties
    const outputLayerProperties: OutputLayerProperties = {
      id,
      photoUrl: mostRecentPhotoInfo?.url,
      photoAuthorName: mostRecentPhotoInfo?.userName,
      photoAuthorUrl: mostRecentPhotoInfo
        ? `https://wikimapia.org/user/${mostRecentPhotoInfo.userId}`
        : undefined,
      knownAt: objectInfoFile.fetchedAt,
      completionDates: objectInfoFile.data.completionDates,
    };

    outputFeatures.push(
      turf.feature(objectFeature.geometry, deepClean(outputLayerProperties)),
    );
  }

  return {
    type: "FeatureCollection",
    layerRole: "patch",
    features: outputFeatures,
  };
};
