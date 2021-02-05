import path from "path";

import { getRegionDirPath } from "../../region";
import { Tile } from "../../tiles";

export const getWikimapiaDirPath = () => {
  return path.resolve(getRegionDirPath(), "sources", "wikimapia");
};

export const getWikimapiaTilesDirPath = () => {
  return path.resolve(getWikimapiaDirPath(), "tiles");
};

export const getWikimapiaTileDataFileName = () => "data.json";

export const getWikimapiaTileDataFilePath = (tile: Tile) => {
  return path.resolve(
    getWikimapiaTilesDirPath(),
    `${tile[2]}`,
    `${tile[0]}`,
    `${tile[1]}`,
    getWikimapiaTileDataFileName(),
  );
};

export const getWikimapiaObjectDetailsDir = () => {
  return path.resolve(getWikimapiaDirPath(), "object-details");
};

export const deriveWikimapiaObjectFilePath = (
  wikimapiaId: number,
  fileNameSuffix: string,
) => {
  const normalisedWikimapiaId = `${wikimapiaId}`.padStart(9, "0");

  return path.resolve(
    getRegionDirPath(),
    "sources",
    "wikimapia",
    "objects",
    `${normalisedWikimapiaId.substring(0, 3)}xxxxxx`,
    `${normalisedWikimapiaId}--${fileNameSuffix}`,
  );
};
