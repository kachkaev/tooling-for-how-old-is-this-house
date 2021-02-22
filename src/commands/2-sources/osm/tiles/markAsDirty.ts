import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import * as envalid from "envalid";

import { customEnvalidReporter } from "../../../../shared/customEnvalidReporter";
import { getRegionExtent } from "../../../../shared/region";
import { createAxiosInstanceForOsmTiles } from "../../../../shared/sources/osm";
import { processTiles, TileStatus } from "../../../../shared/tiles";

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

const initialZoom = 10;
const maxAllowedZoom = 17;

export const MarkAsDirty: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/osm: Marking tiles as dirty"));

  const originalRegionExtent = await getRegionExtent();
  const regionExtent = originalRegionExtent;

  const axiosInstance = createAxiosInstanceForOsmTiles();

  await processTiles({
    initialZoom,
    maxAllowedZoom,
    regionExtent,
    processTile: async (tile) => {
      const [tileX, tileY, tileZoom] = tile;
      const tileStatus: TileStatus =
        tileZoom === maxAllowedZoom ? "complete" : "needsSplitting";

      const canBeSkipped = tileZoom >= 14 && (tileX + tileY) % 2 > 0;

      if (canBeSkipped) {
        return { cacheStatus: "used", tileStatus };
      }

      await axiosInstance.get(
        `https://tile.openstreetmap.org/${tileZoom}/${tileX}/${tileY}.png`,
      );

      return { cacheStatus: "notUsed", tileStatus };
    },
    logger,
  });
};

autoStartCommandIfNeeded(MarkAsDirty, __filename);
