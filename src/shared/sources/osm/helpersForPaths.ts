import path from "path";

import { gettTerritoryDirPath } from "../../territory";
import { Tile } from "../../tiles";

export const getOsmDirPath = () => {
  return path.resolve(gettTerritoryDirPath(), "sources", "osm");
};

export const getFetchedOsmBuildingsFilePath = (): string => {
  return path.resolve(getOsmDirPath(), "fetched-buildings.geojson");
};

export const getFetchedOsmBoundariesFilePath = (): string => {
  return path.resolve(getOsmDirPath(), "fetched-boundaries.geojson");
};

export const getOsmTileImageFilePath = (
  version: string,
  tile: Tile,
): string => {
  const [tileX, tileY, tileZ] = tile;

  return path.resolve(
    getOsmDirPath(),
    "tile-images",
    version,
    `${tileZ}`,
    `${tileX}`,
    `${tileY}.png`,
  );
};
