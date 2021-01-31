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
