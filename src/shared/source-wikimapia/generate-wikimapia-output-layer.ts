import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";

import { deepClean } from "../deep-clean";
import { processFiles } from "../process-files";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
} from "../stage-output-layers";
import { combineWikimapiaTiles } from "./combine-wikimapia-tiles";
import {
  getWikimapiaObjectInfoFileSuffix,
  getWikimapiaObjectsDirPath,
} from "./helpers-for-paths";
import { WikimapiaObjectInfoFile, WikimapiaObjectPhotoInfo } from "./types";

const minAreaInMeters = 10;
const maxAreaInMeters = 50_000;
const maxPerimeterInMeters = 2000;
const maxPerimeterToAreaSqrtRatio = 20;

const maxIdDeltaForPhotosInOneBatch = 100;

const checkIfNameIsAppropriateForBuilding = (name: string): boolean => {
  if (/колонка/i.test(name)) {
    return false;
  }

  return true;
};

/**
 * http://photos.wikimapia.org/p/00/08/38/48/20_big.jpg
 * ↓
 * 8384820
 */
const extractPhotoIdFromUrl = (url: string): number => {
  const digits = [...url].filter((char) => char >= "0" && char <= "9");

  return Number.parseInt(digits.join("").replace(/^0+/, ""));
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

  let result: WikimapiaObjectPhotoInfo | undefined;
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
  output,
}) => {
  const outputFeatures: OutputLayer["features"] = [];

  const objectInfoFileById: Record<string, WikimapiaObjectInfoFile> = {};

  await processFiles({
    output,
    fileSearchDirPath: getWikimapiaObjectsDirPath(),
    fileSearchPattern: `**/*-${getWikimapiaObjectInfoFileSuffix()}`,
    filesNicknameToLog: "wikimapia object info files",
    processFile: async (filePath) => {
      const objectInfoFile = (await fs.readJson(
        filePath,
      )) as WikimapiaObjectInfoFile;

      objectInfoFileById[`${objectInfoFile.data.wikimapiaId}`] = objectInfoFile;
    },
    statusReportFrequency: 1000,
  });

  const { objectExtentFeatures } = await combineWikimapiaTiles({ output });

  for (const objectFeature of objectExtentFeatures) {
    const id = `${objectFeature.properties.wikimapiaId}`;
    const objectInfoFile = objectInfoFileById[id];
    if (!objectInfoFile) {
      output?.write(chalk.yellow(`Could not find info for object ${id}\n`));
      continue;
    }

    // Exclude demolished features
    if (objectInfoFile.data.demolished) {
      continue;
    }

    // Exclude objects that are too big or too small
    const areaInMeters = turf.area(objectFeature);
    if (areaInMeters > maxAreaInMeters || areaInMeters < minAreaInMeters) {
      continue;
    }

    const name = objectInfoFile.data.name;
    if (name && !checkIfNameIsAppropriateForBuilding(name)) {
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
    const outputLayerProperties: OutputLayerProperties = deepClean({
      id,
      photoUrl: pickedPhotoInfo?.url,
      photoAuthorName: pickedPhotoInfo?.userName,
      photoAuthorUrl: pickedPhotoInfo
        ? `https://wikimapia.org/user/${pickedPhotoInfo.userId}`
        : undefined,
      knownAt: objectInfoFile.fetchedAt,
      completionTime:
        objectInfoFile.data.completionTime ??
        objectInfoFile.data.completionDates,
      name,
    });

    outputFeatures.push(
      turf.feature(objectFeature.geometry, outputLayerProperties),
    );
  }

  return {
    type: "FeatureCollection",
    layerRole: "patch",
    features: outputFeatures,
  };
};
