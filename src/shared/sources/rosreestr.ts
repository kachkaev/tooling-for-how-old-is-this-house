import path from "path";

import { getRegionDirPath } from "../region";
import { ProcessTile, Tile } from "../tiles";

/**
 * CCO: capital construction object (ru: ОКС)
 * lot: land lot (ru: Земельный участок)
 */
export type FeatureType = "cco" | "lot";

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

export const generateProcessTile = (
  featureType: FeatureType,
): ProcessTile => async (tile) => {
  const tileDataFilePath = getTileDataFilePath(tile, featureType);

  return {
    cacheState: Math.random() > 0.5 ? "notUsed" : "used",
    tileStatus: Math.random() > 0.2 ? "complete" : "needsSplitting",
    comment: tileDataFilePath,
  };
};
