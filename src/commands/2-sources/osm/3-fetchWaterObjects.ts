import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import dedent from "dedent";

import { createBboxFeature } from "../../../shared/helpersForGeometry";
import { writeFormattedJson } from "../../../shared/helpersForJson";
import {
  fetchGeojsonFromOverpassApi,
  getFetchedOsmWaterObjectsFilePath,
} from "../../../shared/sources/osm";
import { getTerritoryExtent } from "../../../shared/territory";

const territoryExtentBboxBufferInMeters = 5000;

export const fetchWaterObjects: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/osm: fetch water objects"));

  const geojsonData = await fetchGeojsonFromOverpassApi({
    logger,
    acceptedGeometryTypes: [
      "LineString",
      "MultiLineString",
      "Polygon",
      "MultiPolygon",
    ],
    query: dedent`
        [out:json][timeout:60];
        (
          way["waterway"]({{territory_extent}});
          relation["waterway"]({{territory_extent}});
          way["natural"="water"]({{territory_extent}});
          relation["natural"="water"]({{territory_extent}});
          way["landuse"="reservoir"]({{territory_extent}});
          relation["landuse"="reservoir"]({{territory_extent}});
          way["natural"="wetland"]({{territory_extent}});
          relation["natural"="wetland"]({{territory_extent}});
        );
        out body;
        >;
        out skel qt;
      `,
    customTerritoryExtent: createBboxFeature(
      await getTerritoryExtent(),
      territoryExtentBboxBufferInMeters,
    ),
  });

  process.stdout.write(chalk.green("Saving..."));

  const filePath = getFetchedOsmWaterObjectsFilePath();
  await writeFormattedJson(filePath, geojsonData);

  process.stdout.write(` Done: ${chalk.magenta(filePath)}\n`);
};

autoStartCommandIfNeeded(fetchWaterObjects, __filename);
