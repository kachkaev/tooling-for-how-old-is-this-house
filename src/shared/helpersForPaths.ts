import path from "path";

import { getRegionDirPath } from "./region";

export const getSourcesDirPath = () => {
  return path.resolve(getRegionDirPath(), "sources");
};

export const getSourceDirPath = (source: string) => {
  return path.resolve(getSourcesDirPath(), "sources", source);
};
