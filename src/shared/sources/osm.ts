import path from "path";

import { getRegionDirPath } from "../region";

export const getOsmDirPath = () => {
  return path.resolve(getRegionDirPath(), "sources", "osm");
};

export const getOsmRawBuildingsFilePath = (): string => {
  return path.resolve(getOsmDirPath(), "raw-buildings.geojson");
};
