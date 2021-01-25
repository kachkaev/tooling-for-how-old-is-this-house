import * as tilebelt from "@mapbox/tilebelt";
import * as turf from "@turf/turf";
import chalk from "chalk";

export type Tile = [x: number, y: number, zoom: number];

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
  for (let x = bottomLeftTile[0]; x <= topRightTile[0]; x += 1) {
    for (let y = topRightTile[1]; y <= bottomLeftTile[1]; y += 1) {
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
          } ${tileStatus}`,
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

export const addBufferToBbox = (
  bbox: turf.BBox,
  bufferInMeters: number,
): turf.BBox =>
  turf.bbox(
    turf.buffer(turf.bboxPolygon(bbox), bufferInMeters / 1000, {
      units: "kilometers",
      steps: 1,
    }),
  );
