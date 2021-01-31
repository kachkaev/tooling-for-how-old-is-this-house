import path from "path";

import { getRegionDirPath } from "../../region";
import { Tile } from "../../tiles";
import { ObjectType } from "./types";

export const getRosreestrDirPath = () => {
  return path.resolve(getRegionDirPath(), "sources", "rosreestr");
};

export const getObjectDirPath = (objectType: ObjectType) => {
  return path.resolve(getRosreestrDirPath(), `${objectType}s`);
};

export const getTilesDirPath = (objectType: ObjectType) => {
  return path.resolve(getObjectDirPath(objectType), "by-tiles");
};

export const getTileDataFileName = () => "data.json";

export const getTileDataFilePath = (objectType: ObjectType, tile: Tile) => {
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
  block: string,
  pageNumber: number,
) => {
  return path.resolve(
    getObjectInfoPagesDirPath(),
    block.replace(/:/g, "/"),
    `page-${`${pageNumber}`.padStart(3, "0")}.json`,
  );
};
