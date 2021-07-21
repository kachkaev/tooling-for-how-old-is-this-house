import path from "path";

import { getTerritoryDirPath } from "../../territory";

export const getWikidataDirPath = () => {
  return path.resolve(getTerritoryDirPath(), "sources", "wikidata");
};

export const getWikidataProcessedQueryResultFilePath = (): string => {
  return path.resolve(getWikidataDirPath(), "processed-query-result.json");
};
