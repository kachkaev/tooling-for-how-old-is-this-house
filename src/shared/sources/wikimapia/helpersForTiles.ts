import { TileStatus } from "../../tiles";
import { WikimapiaTileData } from "./types";

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
