import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import { AxiosInstance } from "axios";
import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";
import path from "path";

import { cleanEnv } from "../../../../shared/cleanEnv";
import {
  createAxiosInstanceForOsmTiles,
  getOsmTileImageFilePath,
} from "../../../../shared/sources/osm";
import { getTerritoryExtent } from "../../../../shared/territory";
import { processTiles, TileStatus } from "../../../../shared/tiles";

// Inspired by https://www.kindacode.com/article/using-axios-to-download-images-and-videos-in-node-js/
const downloadFile = async (
  axiosInstance: AxiosInstance,
  fileUrl: string,
  downloadFilePath: string,
) => {
  try {
    const response = await axiosInstance.get(fileUrl, {
      responseType: "stream",
    });

    await response.data.pipe(fs.createWriteStream(downloadFilePath));
  } catch (err) {
    throw new Error(`${err}`);
  }
};

export const getOsmTileVersion = (): string => {
  const env = cleanEnv({
    OSM_TILE_VERSION: envalid.str({
      desc: "Name of subdirectory for tiles to download",
    }),
  });

  return env.OSM_TILE_VERSION;
};

const initialZoom = 0;
const maxAllowedZoom = 17;

export const fetchImages: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/osm: Fetching OSM tile images"));

  const originalTerritoryExtent = await getTerritoryExtent();
  const territoryExtent = originalTerritoryExtent;

  const axiosInstance = createAxiosInstanceForOsmTiles();

  await processTiles({
    initialZoom,
    maxAllowedZoom,
    territoryExtent,
    processTile: async (tile) => {
      const [tileX, tileY, tileZoom] = tile;
      const tileStatus: TileStatus =
        tileZoom === maxAllowedZoom ? "complete" : "needsSplitting";

      const tileImageFileName = getOsmTileImageFilePath(
        getOsmTileVersion(),
        tile,
      );
      if (await fs.pathExists(tileImageFileName)) {
        return {
          cacheStatus: "used",
          tileStatus,
          comment: tileImageFileName,
        };
      }

      await fs.ensureDir(path.dirname(tileImageFileName));
      await downloadFile(
        axiosInstance,
        `https://tile.openstreetmap.org/${tileZoom}/${tileX}/${tileY}.png`,
        tileImageFileName,
      );

      return { cacheStatus: "notUsed", tileStatus, comment: tileImageFileName };
    },
    logger,
  });
};

autoStartCommandIfNeeded(fetchImages, __filename);
