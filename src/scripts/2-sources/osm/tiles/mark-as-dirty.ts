import chalk from "chalk";

import { createAxiosInstanceForOsmTiles } from "../../../../shared/sources/osm";
import { getTerritoryExtent } from "../../../../shared/territory";
import { processTiles, TileStatus } from "../../../../shared/tiles";

const output = process.stdout;

const initialZoom = 10;
const maxAllowedZoom = 17;

const script = async () => {
  output.write(chalk.bold("sources/osm: Marking tiles as dirty\n"));

  const territoryExtent = await getTerritoryExtent();

  const axiosInstance = createAxiosInstanceForOsmTiles();

  await processTiles({
    initialZoom,
    output,
    maxAllowedZoom,
    territoryExtent,
    processTile: async (tile) => {
      const [tileX, tileY, tileZoom] = tile;
      const tileStatus: TileStatus =
        tileZoom === maxAllowedZoom ? "complete" : "needsSplitting";

      // const canBeSkipped = tileZoom >= 14 && (tileX + tileY) % 2 === 0;
      const canBeSkipped = false;

      if (canBeSkipped) {
        return { cacheStatus: "used", tileStatus };
      }

      await axiosInstance.get(
        `https://tile.openstreetmap.org/${tileZoom}/${tileX}/${tileY}.png`,
      );

      return { cacheStatus: "notUsed", tileStatus };
    },
  });
};

await script();
