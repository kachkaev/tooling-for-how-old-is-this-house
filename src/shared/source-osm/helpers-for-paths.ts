import path from "node:path";

import { getTerritoryDirPath } from "../territory";
import { Tile } from "../tiles";

export const getOsmDirPath = () => {
  return path.resolve(getTerritoryDirPath(), "sources", "osm");
};

export const getFetchedOsmBuildingsFilePath = (): string => {
  return path.resolve(getOsmDirPath(), "fetched-buildings.geojson");
};

export const getFetchedOsmBoundariesForRegionsFilePath = (): string => {
  return path.resolve(
    getOsmDirPath(),
    "fetched-boundaries-for-regions.geojson",
  );
};

export const getFetchedOsmBoundariesForSettlementsFilePath = (): string => {
  return path.resolve(
    getOsmDirPath(),
    "fetched-boundaries-for-settlements.geojson",
  );
};

export const getFetchedOsmRailwaysFilePath = (): string => {
  return path.resolve(getOsmDirPath(), "fetched-railways.geojson");
};

export const getFetchedOsmRoadsFilePath = (): string => {
  return path.resolve(getOsmDirPath(), "fetched-roads.geojson");
};

export const getFetchedOsmWaterObjectsFilePath = (): string => {
  return path.resolve(getOsmDirPath(), "fetched-water-objects.geojson");
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
