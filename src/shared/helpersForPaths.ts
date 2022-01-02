import path from "node:path";

import { getTerritoryDirPath } from "./territory";

export const getSourcesDirPath = () => {
  return path.resolve(getTerritoryDirPath(), "sources");
};

export const getSourceDirPath = (source: string) => {
  return path.resolve(getSourcesDirPath(), source);
};
