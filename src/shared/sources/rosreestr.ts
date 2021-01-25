import path from "path";

import { getRegionDirPath } from "../region";
import { ProcessTile, Tile } from "../tiles";

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

/*
rosreestr
  lots
    by-tiles
  ccos
    by-code
    by-tiles
 */

export const generateProcessTile = (
  featureType: FeatureType,
): ProcessTile => async (tile) => ({
  cacheState: Math.random() > 0.5 ? "notUsed" : "used",
  tileStatus: Math.random() > 0.2 ? "complete" : "needsSplitting",
  comment: getTileDataFilePath(tile, featureType),
});
