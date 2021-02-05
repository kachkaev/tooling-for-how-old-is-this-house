import * as tilebelt from "@mapbox/tilebelt";
import * as turf from "@turf/turf";
import chalk from "chalk";
import _ from "lodash";

export type Tile = [x: number, y: number, zoom: number];

export const stringifyTile = (tile: Tile): string =>
  `${tile[2]}/${tile[0]}/${tile[1]}`;

export const parseTile = (stringifiedTile: string): Tile => {
  const result = stringifiedTile.split("/").map((v) => parseInt(v) ?? 0);
  if (result.length !== 3) {
    throw new Error(
      `Expected 3 parts in stringified tile, got ${result.length}`,
    );
  }

  return result as Tile;
};

export type TileStatus = "complete" | "needsSplitting";
export type CacheStatus = "used" | "notUsed";

export type ProcessTile = (
  tile: Tile,
) => Promise<{
  cacheStatus: CacheStatus;
  tileStatus: TileStatus;
  comment?: string;
}>;

export const processTiles = async ({
  regionExtent,
  initialZoom,
  maxAllowedZoom,
  processTile,
  logger,
}: {
  regionExtent: turf.Feature<turf.MultiPolygon | turf.Polygon>;
  initialZoom: number;
  maxAllowedZoom: number;
  processTile: ProcessTile;
  logger: Console;
}) => {
  const regionBbox = turf.bbox(regionExtent);
  const bottomLeftTile = tilebelt.pointToTile(
    regionBbox[0],
    regionBbox[1],
    initialZoom,
  ) as Tile;
  const topRightTile = tilebelt.pointToTile(
    regionBbox[2],
    regionBbox[3],
    initialZoom,
  ) as Tile;

  const initialTiles: Tile[] = [];
  for (let y = topRightTile[1]; y <= bottomLeftTile[1]; y += 1) {
    for (let x = bottomLeftTile[0]; x <= topRightTile[0]; x += 1) {
      initialTiles.push([x, y, initialZoom]);
    }
  }

  let tiles = initialTiles;
  let nextZoomTiles: Tile[];
  for (let zoom = initialZoom; zoom <= maxAllowedZoom; zoom += 1) {
    logger.log(chalk.green(`Zoom level: ${zoom}`));
    nextZoomTiles = [];
    for (const tile of tiles) {
      if (
        !turf.intersect(
          tilebelt.tileToGeoJSON(tile),
          regionExtent.geometry as turf.Polygon,
        )
      ) {
        continue;
      }

      const { cacheStatus, tileStatus, comment } = await processTile(tile);
      if (tileStatus === "needsSplitting") {
        nextZoomTiles.push(...(tilebelt.getChildren(tile) as Tile[]));
      }
      logger.log(
        (cacheStatus === "used" ? chalk.gray : chalk.magenta)(
          `  [${tile.join(", ")}]:${
            comment ? ` ${comment}` : ""
          } - ${_.lowerCase(tileStatus)}`,
        ),
      );
    }

    tiles = nextZoomTiles;
    if (!tiles.length) {
      break;
    }
  }

  if (tiles.length) {
    throw new Error(
      `Max zoom ${maxAllowedZoom} reached, number of tiles on zoom ${
        maxAllowedZoom + 1
      }: ${tiles.length}`,
    );
  }
};
