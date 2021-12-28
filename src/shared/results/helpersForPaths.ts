import { DateTime } from "luxon";
import path from "path";

import {
  ensureTerritoryGitignoreContainsLine,
  getTerritoryDirPath,
} from "../territory";

export const getResultsDirPath = (): string =>
  path.resolve(getTerritoryDirPath(), "results");

export const generateVersionSuffix = (): string =>
  `v${DateTime.utc().toFormat("y-MM-dd-HHmmss")}Z`;

export const ensureTerritoryGitignoreContainsResults =
  async (): Promise<void> => {
    await ensureTerritoryGitignoreContainsLine("/results");
  };
