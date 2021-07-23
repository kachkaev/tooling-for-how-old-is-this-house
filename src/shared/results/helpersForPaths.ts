import { DateTime } from "luxon";
import path from "path";

import { getTerritoryDirPath } from "../territory";

export const getResultsDirPath = (): string =>
  path.resolve(getTerritoryDirPath(), "results");

export const generateVersionSuffix = (): string =>
  `v${DateTime.utc().toFormat("y-MM-dd-HHmmss")}Z`;
