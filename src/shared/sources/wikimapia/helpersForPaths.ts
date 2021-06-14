import path from "path";

import { getTerritoryDirPath } from "../../territory";
import { Tile } from "../../tiles";

export const getWikimapiaDirPath = () => {
  return path.resolve(getTerritoryDirPath(), "sources", "wikimapia");
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

export const getWikimapiaObjectsDirPath = () => {
  return path.resolve(getWikimapiaDirPath(), "objects");
};

export const getWikimapiaRawObjectInfoFileSuffix = () => "raw-info.html";
export const getWikimapiaObjectInfoFileSuffix = () => "info.json";

export const deriveWikimapiaObjectFilePath = (
  wikimapiaId: number,
  fileNameSuffix: string,
) => {
  const normalisedWikimapiaId = `${wikimapiaId}`.padStart(9, "0");

  return path.resolve(
    getWikimapiaObjectsDirPath(),
    `${normalisedWikimapiaId.substring(0, 3)}xxxxxx`,
    `${normalisedWikimapiaId}--${fileNameSuffix}`,
  );
};
