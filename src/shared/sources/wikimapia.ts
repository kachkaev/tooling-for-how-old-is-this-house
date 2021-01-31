import turf from "@turf/turf";
import path from "path";

import { getRegionDirPath } from "../region";
import { Tile, TileStatus } from "../tiles";

export type ProcessedWikimapiaTileResponse = Array<
  turf.Feature<turf.GeometryCollection>
>;

export interface WikimapiaTileData {
  tile: Tile;
  fetchedAt: string;
  response: ProcessedWikimapiaTileResponse;
}

export const getWikimapiaDirPath = () => {
  return path.resolve(getRegionDirPath(), "sources", "wikimapia");
};

export const getWikimapiaTilesDir = () => {
  return path.resolve(getWikimapiaDirPath(), "tiles");
};

export const getWikimapiaTileDataFileName = () => "data.json";

export const getWikimapiaTileDataFilePath = (tile: Tile) => {
  return path.resolve(
    getWikimapiaTilesDir(),
    `${tile[2]}`,
    `${tile[0]}`,
    `${tile[1]}`,
    getWikimapiaTileDataFileName(),
  );
};

export const getWikimapiaObjectDetailsDir = () => {
  return path.resolve(getWikimapiaDirPath(), "object-details");
};

const maxFeaturesPerTileRequestForSplitting = 100;

export const deriveWikimapiaTileDataStatus = (
  tileData: WikimapiaTileData,
): TileStatus => {
  const numberOfFeatures = tileData.response.length;

  return numberOfFeatures >= maxFeaturesPerTileRequestForSplitting
    ? "needsSplitting"
    : "complete";
};

export const generateWikimapiaTileComment = (
  tileDataFilePath: string,
  tileData: WikimapiaTileData,
): string => {
  const numberOfFeatures = tileData?.response?.length;
  const numberOfFeaturesAsString = `${numberOfFeatures ?? "?"}`;

  return `${tileDataFilePath} ${numberOfFeaturesAsString.padStart(3)}`;
};
