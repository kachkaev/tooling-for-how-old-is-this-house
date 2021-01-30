import path from "path";

import { getRegionDirPath } from "../../region";
import { Tile } from "../../tiles";
import { FeatureType } from "./types";

const getFeatureTypeDirPath = (featureType: FeatureType) => {
  return path.resolve(
    getRegionDirPath(),
    "sources",
    "rosreestr",
    `${featureType}s`,
  );
};

export const getTilesDirPath = (featureType: FeatureType) => {
  return path.resolve(getFeatureTypeDirPath(featureType), "by-tiles");
};

export const getTileDataFileName = () => "data.json";

export const getTileDataFilePath = (featureType: FeatureType, tile: Tile) => {
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
