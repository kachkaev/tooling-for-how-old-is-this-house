import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import dedent from "dedent";

import { createBboxFeature } from "../../../shared/helpersForGeometry";
import { writeFormattedJson } from "../../../shared/helpersForJson";
import {
  fetchGeojsonFromOverpassApi,
  getFetchedOsmRoadsFilePath,
} from "../../../shared/sources/osm";
import { getTerritoryExtent } from "../../../shared/territory";

const territoryExtentBboxBufferInMeters = 5000;

export const fetchRoads: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/osm: fetch roads"));

  const geojsonData = await fetchGeojsonFromOverpassApi({
    logger,
    acceptedGeometryTypes: ["LineString"],
    query: dedent`
        [out:json][timeout:60];
        (
          way["highway"~"trunk"]({{territory_extent}});
          way["highway"~"primary"]({{territory_extent}});
          way["highway"~"primary_link"]({{territory_extent}});
          way["highway"~"secondary"]({{territory_extent}});
          way["highway"~"secondary_link"]({{territory_extent}});
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

  const filePath = getFetchedOsmRoadsFilePath();
  await writeFormattedJson(filePath, geojsonData);

  process.stdout.write(` Done: ${chalk.magenta(filePath)}\n`);
};

autoStartCommandIfNeeded(fetchRoads, __filename);
