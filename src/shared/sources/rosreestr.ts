import * as tilebelt from "@mapbox/tilebelt";
import * as turf from "@turf/turf";
import axios from "axios";
import axiosRetry from "axios-retry";
import fs from "fs-extra";
import path from "path";
import sortKeys from "sort-keys";

import { addBufferToBbox } from "../geoHelpers";
import { getRegionDirPath } from "../region";
import { ProcessTile, Tile, TileStatus } from "../tiles";

/**
 * CCO: capital construction object (ru: ОКС)
 * lot: land lot (ru: Земельный участок)
 */
export type FeatureType = "cco" | "lot";

const maxSupportedFeaturesPerTileRequest = 40;

const featureNumericIdLookup: Record<FeatureType, number> = {
  cco: 5,
  lot: 1,
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

const getTilesDirPath = (featureType: FeatureType) => {
  return path.resolve(
    getRegionDirPath(),
    "sources",
    "rosreestr",
    `${featureType}s`,
    "by-tiles",
  );
};

const getTileDataFileName = () => "data.json";

const getTileDataFilePath = (tile: Tile, featureType: FeatureType) => {
  return path.resolve(
    getTilesDirPath(featureType),
    `${tile[2]}`,
    `${tile[0]}`,
    `${tile[1]}`,
    getTileDataFileName(),
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
      `https://pkk.rosreestr.ru/api/features/${featureNumericIdLookup[featureType]}`,
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

export const summarizeTiles = async ({
  featureType,
  logger,
}: {
  featureType: FeatureType;
  logger: Console;
}) => {
  logger.log(featureType);
};
