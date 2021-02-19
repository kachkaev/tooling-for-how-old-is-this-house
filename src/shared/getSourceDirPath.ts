import path from "path";

import { getRegionDirPath } from "./region";

export const getSourceDirPath = (source: string) => {
  return path.resolve(getRegionDirPath(), "sources", source);
};
