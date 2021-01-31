import * as tilebelt from "@mapbox/tilebelt";
import turf from "@turf/turf";
import axios from "axios";
import axiosRetry from "axios-retry";
import fs from "fs-extra";
import sortKeys from "sort-keys";

import { addBufferToBbox } from "../../helpersForGeometry";
import { getSerialisedNow, writeFormattedJson } from "../../helpersForJson";
import { ProcessTile, TileStatus } from "../../tiles";
import { getTileDataFilePath } from "./helpersForPaths";
import { ObjectType, TileData, TileResponse } from "./types";

// The API may return fewer items than requested even if not all of them fit the first page.
// This might be due to item deduplication that happens when the result is prepared.
// Judging tile completion with some tolerance helps to not miss the data.

const maxSupportedFeaturesPerTileRequest = 40;
const tileCompletionTolerance = 2;

const featureNumericIdLookup: Record<ObjectType, number> = {
  cco: 5,
  lot: 1,
};

export const deriveTileDataStatus = (tileData: TileData): TileStatus => {
  const numberOfFeatures = tileData.response.features.length;
  if (numberOfFeatures > maxSupportedFeaturesPerTileRequest) {
    throw new Error(`Unexpected number of features ${numberOfFeatures}`);
  }

  return numberOfFeatures >=
    maxSupportedFeaturesPerTileRequest - tileCompletionTolerance
    ? "needsSplitting"
    : "complete";
};

const generateTileComment = (
  tileDataFilePath: string,
  tileData: TileData,
): string => {
  const numberOfFeatures = tileData?.response?.features?.length;
  const numberOfFeaturesAsString = `${numberOfFeatures ?? "?"}`;

  return `${tileDataFilePath} ${numberOfFeaturesAsString.padStart(2)}`;
};

const getTileBufferInMeters = (zoom: number): number => {
  if (zoom < 19) {
    return 10;
  }
  if (zoom === 19) {
    return 5;
  }
  if (zoom === 20) {
    return 2;
  }
  if (zoom === 21) {
    return 1;
  }

  return 0;
};

export const generateProcessTile = (
  objectType: ObjectType,
): ProcessTile => async (tile) => {
  const tileDataFilePath = getTileDataFilePath(objectType, tile);

  try {
    const cachedTileData = (await fs.readJson(tileDataFilePath)) as TileData;

    return {
      cacheStatus: "used",
      tileStatus: deriveTileDataStatus(cachedTileData),
      comment: generateTileComment(tileDataFilePath, cachedTileData),
    };
  } catch {
    // noop – proceeding with actual fetching
  }

  const tileExtentGeometry = turf.bboxPolygon(
    addBufferToBbox(
      tilebelt.tileToBBOX(tile) as turf.BBox,
      getTileBufferInMeters(tile[2]),
    ),
  ).geometry;

  if (!tileExtentGeometry) {
    throw new Error("Unexpected empty geometry");
  }

  axiosRetry(axios);

  const tileResponse = (
    await axios.get<TileResponse>(
      `https://pkk.rosreestr.ru/api/features/${featureNumericIdLookup[objectType]}`,
      {
        params: {
          sq: JSON.stringify(tileExtentGeometry),
          tolerance: 100,
          limit: maxSupportedFeaturesPerTileRequest,
        },
        responseType: "json",
        "axios-retry": {
          retries: 30,
          retryDelay: (retryCount) => (retryCount - 1) * 500,
          retryCondition: (error) =>
            ![200, 404].includes(error.response?.status ?? 0),
        },
      },
    )
  ).data;

  const tileData: TileData = {
    tile,
    fetchedAt: getSerialisedNow(),
    fetchedExtent: tileExtentGeometry,
    response: sortKeys(tileResponse, { deep: true }),
  };

  await writeFormattedJson(tileDataFilePath, tileData);

  return {
    cacheStatus: "notUsed",
    tileStatus: deriveTileDataStatus(tileData),
    comment: generateTileComment(tileDataFilePath, tileData),
  };
};
