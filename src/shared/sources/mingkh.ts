import path from "path";

import { getRegionDirPath } from "../region";

export const getHouseListFilePath = (regionUrl: string, cityUrl: string) =>
  path.resolve(
    getRegionDirPath(),
    "sources",
    "migkh",
    "houseLists",
    `${regionUrl}--${cityUrl}.json`,
  );
