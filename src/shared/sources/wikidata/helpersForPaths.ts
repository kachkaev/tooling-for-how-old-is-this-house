import path from "path";

import { getTerritoryDirPath } from "../../territory";

export const getWikidataDirPath = () => {
  return path.resolve(getTerritoryDirPath(), "sources", "wikidata");
};

export const getWikidataRecordsFilePath = (): string => {
  return path.resolve(getWikidataDirPath(), "raw-records.json");
};
