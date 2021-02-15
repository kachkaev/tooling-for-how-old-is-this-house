import path from "path";

import { getOutputLayerFileName } from "../../output";
import { getRegionDirPath } from "../../region";

export const getOsmDirPath = () => {
  return path.resolve(getRegionDirPath(), "sources", "osm");
};

export const getFetchedOsmBuildingsFilePath = (): string => {
  return path.resolve(getOsmDirPath(), "fetched-buildings.geojson");
};

export const getFetchedOsmBoundariesFilePath = (): string => {
  return path.resolve(getOsmDirPath(), "fetched-boundaries.geojson");
};

export const getOsmOutputLayerFilePath = (): string => {
  return path.resolve(getOsmDirPath(), getOutputLayerFileName());
};
