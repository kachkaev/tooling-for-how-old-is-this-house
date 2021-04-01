import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import dedent from "dedent";

import { writeFormattedJson } from "../../../shared/helpersForJson";
import {
  fetchGeojsonFromOverpassApi,
  getFetchedOsmBuildingsFilePath,
} from "../../../shared/sources/osm";

export const fetchBuildings: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/osm: fetch buildings"));

  const geojsonData = await fetchGeojsonFromOverpassApi({
    logger,
    acceptedGeometryTypes: ["Polygon", "MultiPolygon"],
    query: dedent`
        [out:json][timeout:60];
        (
          way["building"]({{territory_extent}});
          relation["building"]({{territory_extent}});
        );
        out body;
        >;
        out skel qt;
      `,
  });

  process.stdout.write(chalk.green("Saving..."));

  const filePath = getFetchedOsmBuildingsFilePath();
  await writeFormattedJson(filePath, geojsonData);

  process.stdout.write(` Done: ${chalk.magenta(filePath)}\n`);
};

autoStartCommandIfNeeded(fetchBuildings, __filename);
