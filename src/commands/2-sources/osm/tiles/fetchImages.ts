import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import axios from "axios";
import axiosRetry from "axios-retry";
import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";
import http from "http";
import https from "https";
import path from "path";

import { customEnvalidReporter } from "../../../../shared/customEnvalidReporter";
import { getRegionExtent } from "../../../../shared/region";
import { getOsmTileImageFilePath } from "../../../../shared/sources/osm";
import { processTiles, TileStatus } from "../../../../shared/tiles";

// Inspired by https://github.com/axios/axios/issues/1846#issuecomment-434208900
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });
const axiosInstance = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 5000,
});

axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: () => 1000,
  shouldResetTimeout: true,
});

// Inspired by https://www.kindacode.com/article/using-axios-to-download-images-and-videos-in-node-js/
const downloadFile = async (fileUrl: string, downloadFilePath: string) => {
  try {
    const response = await axiosInstance.get(fileUrl, {
      responseType: "stream",
    });

    await response.data.pipe(fs.createWriteStream(downloadFilePath));
  } catch (err) {
    throw new Error(err);
  }
};

export const getOsmTileVersion = (): string => {
  const env = envalid.cleanEnv(
    process.env,
    {
      OSM_TILE_VERSION: envalid.str({
        desc: "Name of subdirectory for tiles to download",
      }),
    },
    { strict: true, reporter: customEnvalidReporter },
  );

  return env.OSM_TILE_VERSION;
};

const initialZoom = 0;
const maxAllowedZoom = 17;

export const fetchImages: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/osm: Fetching OSM tile images"));

  const originalRegionExtent = await getRegionExtent();
  const regionExtent = originalRegionExtent;

  await processTiles({
    initialZoom,
    maxAllowedZoom,
    regionExtent,
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
        `https://tile.openstreetmap.org/${tileZoom}/${tileX}/${tileY}.png`,
        tileImageFileName,
      );

      return { cacheStatus: "notUsed", tileStatus, comment: tileImageFileName };
    },
    logger,
  });
};

autoStartCommandIfNeeded(fetchImages, __filename);
