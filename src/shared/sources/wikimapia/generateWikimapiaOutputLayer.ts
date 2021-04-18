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

/**
 * Wikimapia data is only useful for adding photos to buildings in other layers.
 * Thus, only objects with photos are included in the result.
 */
export const generateWikimapiaOutputLayer: GenerateOutputLayer = async ({
  logger,
}) => {
  const outputFeatures: OutputLayer["features"] = [];

  const objectInfoFileById: Record<string, WikimapiaObjectInfoFile> = {};

  await processFiles({
    logger,
    fileSearchDirPath: getWikimapiaObjectsDir(),
    fileSearchPattern: `**/*-${getWikimapiaObjectInfoFileSuffix()}`,
    processFile: async (filePath) => {
      const objectInfoFile: WikimapiaObjectInfoFile = await fs.readJson(
        filePath,
      );

      objectInfoFileById[`${objectInfoFile.data.wikimapiaId}`] = objectInfoFile;
    },
    statusReportFrequency: 1000,
    showFilePath: true,
  });

  const { objectExtentFeatures } = await combineWikimapiaTiles({ logger });

  for (const objectFeature of objectExtentFeatures) {
    const id = `${objectFeature.properties.wikimapiaId}`;
    const objectInfoFile = objectInfoFileById[id];
    if (!objectInfoFile) {
      logger?.log(chalk.yellow(`Could not find info for object ${id}`));
      continue;
    }

    const photos = objectInfoFile.data.photos;

    if (!photos?.length) {
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

    const mostRecentPhotoInfo = photos[photos.length - 1]!;

    // Combined properties
    const outputLayerProperties: OutputLayerProperties = {
      id,
      photoUrl: mostRecentPhotoInfo.url,
      photoAuthorName: mostRecentPhotoInfo.userName,
      photoAuthorUrl: `https://wikimapia.org/user/${mostRecentPhotoInfo.userId}`,
      knownAt: objectInfoFile.fetchedAt,
    };

    outputFeatures.push(
      turf.feature(objectFeature.geometry, deepClean(outputLayerProperties)),
    );
  }

  return {
    ...turf.featureCollection(outputFeatures),
    properties: { layerRole: "patch" },
  };
};
