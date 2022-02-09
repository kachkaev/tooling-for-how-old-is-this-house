import { AxiosInstance } from "axios";
import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";
import path from "node:path";
import stream from "node:stream";
import { promisify } from "node:util";

import { cleanEnv } from "../../../../shared/cleanEnv";
import {
  createAxiosInstanceForOsmTiles,
  getOsmTileImageFilePath,
} from "../../../../shared/sources/osm";
import { getTerritoryExtent } from "../../../../shared/territory";
import { processTiles, TileStatus } from "../../../../shared/tiles";

const pipeline = promisify(stream.pipeline);

const output = process.stdout;

const downloadFile = async (
  axiosInstance: AxiosInstance,
  fileUrl: string,
  downloadFilePath: string,
) => {
  const response = await axiosInstance.get<stream.Readable>(fileUrl, {
    responseType: "stream",
  });

  await pipeline(response.data, fs.createWriteStream(downloadFilePath));
};

const getOsmTileVersion = (): string => {
  const env = cleanEnv({
    OSM_TILE_VERSION: envalid.str({
      desc: "Name of subdirectory for tiles to download",
    }),
  });

  return env.OSM_TILE_VERSION;
};

const initialZoom = 0;
const maxAllowedZoom = 17;

const script = async () => {
  output.write(chalk.bold("sources/osm: Fetching OSM tile images\n"));

  const originalTerritoryExtent = await getTerritoryExtent();
  const territoryExtent = originalTerritoryExtent;

  const axiosInstance = createAxiosInstanceForOsmTiles();

  await processTiles({
    initialZoom,
    maxAllowedZoom,
    output,
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
  });
};

await script();
