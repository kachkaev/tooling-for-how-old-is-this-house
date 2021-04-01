import path from "path";

import { gettTerritoryDirPath } from "../../territory";

export const getWikidataDirPath = () => {
  return path.resolve(gettTerritoryDirPath(), "sources", "wikidata");
};

export const getWikidataRecordsFilePath = (): string => {
  return path.resolve(getWikidataDirPath(), "raw-records.json");
};
