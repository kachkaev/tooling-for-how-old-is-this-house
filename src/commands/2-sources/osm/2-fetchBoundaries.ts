import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import dedent from "dedent";

import { writeFormattedJson } from "../../../shared/helpersForJson";
import {
  fetchGeojsonFromOverpassApi,
  getFetchedOsmBoundariesFilePath,
} from "../../../shared/sources/osm";

export const fetchBoundaries: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/osm: fetch boundaries"));

  const geojsonData = await fetchGeojsonFromOverpassApi({
    logger,
    acceptedGeometryTypes: ["Polygon", "MultiPolygon"],
    query: dedent`
        [out:json][timeout:60];
        (
          way["admin_level"~"4"]({{region_extent}});
          relation["admin_level"~"4"]({{region_extent}});
          way["place"~"^(city|town|village)$"]({{region_extent}});
          relation["place"~"^(city|town|village)$"]({{region_extent}});
        );
        out body;
        >;
        out skel qt;
      `,
  });

  process.stdout.write(chalk.green("Saving..."));

  const filePath = getFetchedOsmBoundariesFilePath();
  await writeFormattedJson(filePath, geojsonData);

  process.stdout.write(` Done: ${chalk.magenta(filePath)}\n`);
};

autoStartCommandIfNeeded(fetchBoundaries, __filename);
