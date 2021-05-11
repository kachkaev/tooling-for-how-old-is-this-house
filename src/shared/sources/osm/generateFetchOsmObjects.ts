import { Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import dedent from "dedent";

import { writeFormattedJson } from "../../helpersForJson";
import { getTerritoryExtent } from "../../territory";
import { fetchGeojsonFromOverpassApi } from "./fetchGeoJsonFromOverpassApi";

export const generateFetchOsmObjects = ({
  acceptedGeometryTypes,
  filePath,
  getExtent = () => getTerritoryExtent(),
  needToTryAnotherExtentVersion,
  selectors,
  title,
}: {
  acceptedGeometryTypes: turf.GeometryTypes[];
  filePath: string;
  getExtent?: (extentVersion: number) => Promise<turf.Feature<turf.Polygon>>;
  needToTryAnotherExtentVersion?: (
    geojsonData: turf.FeatureCollection<turf.GeometryObject>,
  ) => boolean;
  selectors: string[];
  title: string;
}): Command => async ({ logger }) => {
  logger.log(chalk.bold(`sources/osm: fetch ${title}`));

  const query = dedent`
    [out:json][timeout:60];
    (${selectors.map((selector) => `\n      ${selector}({{extent}});`).join("")}
    );
    out body;
    >;
    out skel qt;
  `;

  logger.log("");
  logger.log(chalk.bold(chalk.cyan("Overpass API query")));
  logger.log("");
  logger.log(chalk.cyan(query));
  logger.log("");

  for (let extentVersion = 0; ; extentVersion += 1) {
    const geojsonData = await fetchGeojsonFromOverpassApi({
      logger,
      acceptedGeometryTypes,
      query,
      extent: await getExtent(extentVersion),
    });

    if (needToTryAnotherExtentVersion?.(geojsonData)) {
      logger.log("Need to try another extent version.");
      continue;
    }

    process.stdout.write(chalk.green("Saving..."));
    await writeFormattedJson(filePath, geojsonData);
    break;
  }

  process.stdout.write(` Done: ${chalk.magenta(filePath)}\n`);
};
