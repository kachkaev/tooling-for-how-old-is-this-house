import path from "node:path";

import { getTerritoryDirPath } from "../../territory";

export const getWikivoyageDirPath = () => {
  return path.resolve(getTerritoryDirPath(), "sources", "wikivoyage");
};

export const getWikivoyagePagesDir = () => {
  return path.resolve(getWikivoyageDirPath(), "pages");
};

export const getWikivoyagePageFileSuffix = () => ".wikitext";
