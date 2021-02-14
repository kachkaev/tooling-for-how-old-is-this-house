import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import dedent from "dedent";

import { filterFeaturesByGeometryType } from "../../../shared/helpersForGeometry";
import { writeFormattedJson } from "../../../shared/helpersForJson";
import {
  fetchGeojsonFromOverpassApi,
  getFetchedOsmBuildingsFilePath,
} from "../../../shared/sources/osm";

export const fetchBuildings: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/wikidata: fetch buildings"));

  const geojsonData = await fetchGeojsonFromOverpassApi({
    logger,
    query: dedent`
        [out:json][timeout:60];
        (
          way["building"]({{region_extent}});
          relation["building"]({{region_extent}});
        );
        out body;
        >;
        out skel qt;
      `,
  });

  geojsonData.features = filterFeaturesByGeometryType({
    features: geojsonData.features,
    acceptedGeometryTypes: ["Polygon", "MultiPolygon"],
    logger,
  });

  process.stdout.write(chalk.green("Saving..."));

  const filePath = getFetchedOsmBuildingsFilePath();
  await writeFormattedJson(filePath, geojsonData);

  process.stdout.write(` Done: ${chalk.magenta(filePath)}\n`);
};

autoStartCommandIfNeeded(fetchBuildings, __filename);
