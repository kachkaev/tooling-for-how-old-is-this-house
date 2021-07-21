import path from "path";

import { getTerritoryDirPath } from "../../territory";

export const getWikidataDirPath = () => {
  return path.resolve(getTerritoryDirPath(), "sources", "wikidata");
};

export const getWikidataFetchedRecordsFilePath = (): string => {
  return path.resolve(getWikidataDirPath(), "fetched-records.json");
};
