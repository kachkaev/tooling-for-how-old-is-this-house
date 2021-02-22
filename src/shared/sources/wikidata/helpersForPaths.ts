import path from "path";

import { getRegionDirPath } from "../../region";

export const getWikidataDirPath = () => {
  return path.resolve(getRegionDirPath(), "sources", "wikidata");
};

export const getWikidataRecordsFilePath = (): string => {
  return path.resolve(getWikidataDirPath(), "raw-records.json");
};
