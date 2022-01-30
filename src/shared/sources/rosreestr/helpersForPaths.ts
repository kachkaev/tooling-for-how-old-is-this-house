import path from "node:path";

import { getTerritoryDirPath } from "../../territory";
import { Tile } from "../../tiles";
import { RosreestrObjectType } from "./types";

export const getRosreestrDirPath = () => {
  return path.resolve(getTerritoryDirPath(), "sources", "rosreestr");
};

export const getObjectDirPath = (objectType: RosreestrObjectType) => {
  return path.resolve(getRosreestrDirPath(), `${objectType}s`);
};

export const getTilesDirPath = (objectType: RosreestrObjectType) => {
  return path.resolve(getObjectDirPath(objectType), "by-tiles");
};

export const getTileDataFileName = () => "data.json";

export const getTileDataFilePath = (
  objectType: RosreestrObjectType,
  tile: Tile,
) => {
  return path.resolve(
    getTilesDirPath(objectType),
    `${tile[2]}`,
    `${tile[0]}`,
    `${tile[1]}`,
    getTileDataFileName(),
  );
};

export const getObjectInfoPagesDirPath = () => {
  return path.resolve(getRosreestrDirPath(), "object-info-pages");
};

export const getObjectInfoPageFilePath = (
  blockCn: string,
  pageNumber: number,
) => {
  return path.resolve(
    getObjectInfoPagesDirPath(),
    blockCn.replace(/:/g, "/"),
    `page-${`${pageNumber}`.padStart(3, "0")}.json`,
  );
};
