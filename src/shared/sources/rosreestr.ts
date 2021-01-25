import * as tilebelt from "@mapbox/tilebelt";
import * as turf from "@turf/turf";
import axios from "axios";
import axiosRetry from "axios-retry";
import fs from "fs-extra";
import path from "path";
import sortKeys from "sort-keys";

import { getRegionDirPath } from "../region";
import { addBufferToBbox, ProcessTile, Tile, TileStatus } from "../tiles";

/**
 * CCO: capital construction object (ru: ОКС)
 * lot: land lot (ru: Земельный участок)
 */
export type FeatureType = "cco" | "lot";

const maxSupportedFeaturesPerTileRequest = 40;
const tileBufferInMeters = 10;

const featureNumericIdLookup: Record<FeatureType, number> = {
  cco: 5,
  lot: 4,
};

export interface TileFeature {
  center: { x: number; y: number };
  attrs: {
    address: string;
    cn: string;
    id: string;
  };
  extent: {
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
  };
  sort: number;
  type: number;
}

export interface TileResponse {
  total: number;
  features: TileFeature[];
}

export interface TileData {
  tile: Tile;
  fetchedAt: string;
  fetchedExtent: turf.Geometry;
  response: TileResponse;
}

const deriveTileDataStatus = (tileData: TileData): TileStatus => {
  const numberOfFeatures = tileData.response.features.length;
  if (numberOfFeatures > maxSupportedFeaturesPerTileRequest) {
    throw new Error(`Unexpected number of features ${numberOfFeatures}`);
  }

  return numberOfFeatures === maxSupportedFeaturesPerTileRequest
    ? "needsSplitting"
    : "complete";
};

const getTileDataFilePath = (tile: Tile, featureType: FeatureType) => {
  return path.resolve(
    getRegionDirPath(),
    "sources",
    "rosreestr",
    `${featureType}s`,
    "by-tiles",
    `${tile[2]}`,
    `${tile[0]}`,
    `${tile[1]}`,
    `data.json`,
  );
};

const generateTileComment = (
  tileDataFilePath: string,
  tileData: TileData,
): string => {
  const numberOfFeatures = tileData?.response?.features?.length;
  const numberOfFeaturesAsString = `${numberOfFeatures ?? "?"}`;

  return `${tileDataFilePath} ${numberOfFeaturesAsString.padStart(2)}`;
};

export const generateProcessTile = (
  featureType: FeatureType,
): ProcessTile => async (tile) => {
  const tileDataFilePath = getTileDataFilePath(tile, featureType);

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
    addBufferToBbox(tilebelt.tileToBBOX(tile) as turf.BBox, tileBufferInMeters),
  ).geometry;

  if (!tileExtentGeometry) {
    throw new Error("Unexpected empty geometry");
  }

  axiosRetry(axios);

  const tileResponse = (
    await axios.get<TileResponse>(
      `https://pkk.rosreestr.ru/api/features/${featureNumericIdLookup[featureType]}`,
      {
        params: {
          sq: JSON.stringify(tileExtentGeometry),
          tolerance: 100,
          limit: maxSupportedFeaturesPerTileRequest,
        },
        responseType: "json",
        "axios-retry": {
          retries: 10,
          retryDelay: (retryCount) => retryCount * 1000,
          retryCondition: (error) => error.response?.status !== 200,
        },
      },
    )
  ).data;

  const tileData: TileData = {
    tile,
    fetchedAt: new Date().toUTCString(),
    fetchedExtent: tileExtentGeometry,
    response: sortKeys(tileResponse, { deep: true }),
  };

  await fs.mkdirp(path.dirname(tileDataFilePath));
  await fs.writeJson(tileDataFilePath, tileData, { spaces: 2 });

  return {
    cacheStatus: "notUsed",
    tileStatus: deriveTileDataStatus(tileData),
    comment: generateTileComment(tileDataFilePath, tileData),
  };
};
