import * as tilebelt from "@mapbox/tilebelt";
import * as turf from "@turf/turf";
import axios from "axios";
import axiosRetry from "axios-retry";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import sortKeys from "sort-keys";

import { addBufferToBbox } from "../helpersForGeometry";
import { getSerialisedNow, writeFormattedJson } from "../helpersForJson";
import { processFiles } from "../processFiles";
import { getRegionDirPath } from "../region";
import { ProcessTile, stringifyTile, Tile, TileStatus } from "../tiles";

/**
 * CCO: capital construction object (ru: ОКС)
 * lot: land lot (ru: Земельный участок)
 */
export type FeatureType = "cco" | "lot";

// The API may return fewer items than requested even if not all of them fit the first page.
// This might be due to item deduplication that happens when the result is prepared.
// Judging tile completion with some tolerance helps to not miss the data.
const maxSupportedFeaturesPerTileRequest = 40;
const tileCompletionTolerance = 2;

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

  return numberOfFeatures >=
    maxSupportedFeaturesPerTileRequest - tileCompletionTolerance
    ? "needsSplitting"
    : "complete";
};

const getFeatureTypeDirPath = (featureType: FeatureType) => {
  return path.resolve(
    getRegionDirPath(),
    "sources",
    "rosreestr",
    `${featureType}s`,
  );
};

const getTilesDirPath = (featureType: FeatureType) => {
  return path.resolve(getFeatureTypeDirPath(featureType), "by-tiles");
};

const getTileDataFileName = () => "data.json";

const getTileDataFilePath = (featureType: FeatureType, tile: Tile) => {
  return path.resolve(
    getTilesDirPath(featureType),
    `${tile[2]}`,
    `${tile[0]}`,
    `${tile[1]}`,
    getTileDataFileName(),
  );
};

export const getCombinedTileFeaturesFilePath = (featureType: FeatureType) => {
  return path.resolve(
    getFeatureTypeDirPath(featureType),
    "combined-tile-features.geojson",
  );
};

export const getCombinedTileExtentsFilePath = (featureType: FeatureType) => {
  return path.resolve(
    getFeatureTypeDirPath(featureType),
    "combined-tile-extents.geojson",
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
  const tileDataFilePath = getTileDataFilePath(featureType, tile);

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
    fetchedAt: getSerialisedNow(),
    fetchedExtent: tileExtentGeometry,
    response: sortKeys(tileResponse, { deep: true }),
  };

  await fs.mkdirp(path.dirname(tileDataFilePath));
  await writeFormattedJson(tileDataFilePath, tileData);

  return {
    cacheStatus: "notUsed",
    tileStatus: deriveTileDataStatus(tileData),
    comment: generateTileComment(tileDataFilePath, tileData),
  };
};

export const combineTiles = async ({
  featureType,
  logger,
}: {
  featureType: FeatureType;
  logger: Console;
}) => {
  const featuresWithDuplicates: turf.Feature[] = [];
  const tiles: turf.Feature[] = [];

  await processFiles({
    logger,
    fileSearchPattern: `**/${getTileDataFileName()}`,
    fileSearchDirPath: getTilesDirPath(featureType),
    processFile: async (filePath) => {
      const tileData = (await fs.readJson(filePath)) as TileData;

      const tileId = stringifyTile(tileData.tile);

      tiles.push(
        turf.feature(tileData.fetchedExtent, {
          tileId,
          fetchedAt: tileData.fetchedAt,
          fetchedFeatureCount: tileData.response.features.length,
        }),
      );

      tileData.response.features.forEach((responseFeature) => {
        // const centroid = turf.toWgs84(
        //   turf.point([responseFeature.center.x, responseFeature.center.y]),
        // ).geometry!;

        const extentGeometry = turf.toWgs84(
          turf.bboxPolygon([
            responseFeature.extent.xmin,
            responseFeature.extent.ymin,
            responseFeature.extent.xmax,
            responseFeature.extent.ymax,
          ]),
        ).geometry!;

        // featuresWithDuplicates.push(
        //   turf.geometryCollection([centroid, extent], {
        //     tileId,
        //     ...responseFeature.attrs,
        //   }),
        // );

        const featureProperties = {
          tileId,
          ...responseFeature.attrs,
        };

        featuresWithDuplicates.push(
          turf.feature(extentGeometry, featureProperties),
        );
      });
    },
  });

  process.stdout.write(chalk.green("Deduplicating features..."));

  const features = _.uniqBy(
    featuresWithDuplicates,
    (feature) => feature.properties?.cn,
  );

  process.stdout.write(
    ` Count reduced from ${featuresWithDuplicates.length} to ${features.length}.\n`,
  );

  logger.log(chalk.green("Saving..."));

  await writeFormattedJson(
    getCombinedTileFeaturesFilePath(featureType),
    turf.featureCollection(features),
  );
  logger.log(
    `Features saved to ${chalk.magenta(
      getCombinedTileFeaturesFilePath(featureType),
    )}`,
  );

  await writeFormattedJson(
    getCombinedTileExtentsFilePath(featureType),
    turf.featureCollection(tiles),
  );
  logger.log(
    `Tile extents saved to ${chalk.magenta(
      getCombinedTileExtentsFilePath(featureType),
    )}`,
  );
};
