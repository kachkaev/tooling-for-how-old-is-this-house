import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";

import { deepClean } from "../../deepClean";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
} from "../../outputLayers";
import { processFiles } from "../../processFiles";
import { combineWikimapiaTiles } from "./combineWikimapiaTiles";
import {
  getWikimapiaObjectInfoFileSuffix,
  getWikimapiaObjectsDirPath,
} from "./helpersForPaths";
import { WikimapiaObjectInfoFile, WikimapiaObjectPhotoInfo } from "./types";

const minAreaInMeters = 3;
const maxAreaInMeters = 50000;
const maxPerimeterInMeters = 2000;
const maxPerimeterToAreaSqrtRatio = 20;

const maxIdDeltaForPhotosInOneBatch = 100;

/**
 * http://photos.wikimapia.org/p/00/08/38/48/20_big.jpg
 * ↓
 * 8384820
 */
const extractPhotoIdFromUrl = (url: string): number => {
  const digits = url.split("").filter((char) => char >= "0" && char <= "9");

  return parseInt(digits.join("").replace(/^0+/, ""));
};

/**
 * Picks first photo from the last upload batch.
 *
 * A batch is defined as photos uploaded together by a single user.
 */
const pickPhotoInfo = (
  photoInfos?: WikimapiaObjectPhotoInfo[],
): WikimapiaObjectPhotoInfo | undefined => {
  if (!photoInfos?.length) {
    return undefined;
  }

  let result: WikimapiaObjectPhotoInfo | undefined = undefined;
  for (let index = photoInfos.length - 1; index >= 0; index -= 1) {
    const photoInfo = photoInfos[index]!;

    if (
      result &&
      (result.userId !== photoInfo.userId ||
        Math.abs(
          extractPhotoIdFromUrl(result.url) -
            extractPhotoIdFromUrl(photoInfo.url),
        ) > maxIdDeltaForPhotosInOneBatch)
    ) {
      break;
    }

    result = photoInfo;
  }

  return result;
};

export const generateWikimapiaOutputLayer: GenerateOutputLayer = async ({
  logger,
}) => {
  const outputFeatures: OutputLayer["features"] = [];

  const objectInfoFileById: Record<string, WikimapiaObjectInfoFile> = {};

  await processFiles({
    logger,
    fileSearchDirPath: getWikimapiaObjectsDirPath(),
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

    const pickedPhotoInfo = pickPhotoInfo(objectInfoFile.data.photos);

    // Combined properties
    const outputLayerProperties: OutputLayerProperties = {
      id,
      photoUrl: pickedPhotoInfo?.url,
      photoAuthorName: pickedPhotoInfo?.userName,
      photoAuthorUrl: pickedPhotoInfo
        ? `https://wikimapia.org/user/${pickedPhotoInfo.userId}`
        : undefined,
      knownAt: objectInfoFile.fetchedAt,
      completionDates: objectInfoFile.data.completionDates,
      name: objectInfoFile.data.name,
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
