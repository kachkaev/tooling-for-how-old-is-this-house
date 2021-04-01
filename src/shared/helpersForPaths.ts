import path from "path";

import { gettTerritoryDirPath } from "./territory";

export const getSourcesDirPath = () => {
  return path.resolve(gettTerritoryDirPath(), "sources");
};

export const getSourceDirPath = (source: string) => {
  return path.resolve(getSourcesDirPath(), source);
};
