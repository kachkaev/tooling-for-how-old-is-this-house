import { Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import dedent from "dedent";

import { createBboxFeature } from "../../helpersForGeometry";
import { writeFormattedJson } from "../../helpersForJson";
import { getTerritoryExtent } from "../../territory";
import { fetchGeojsonFromOverpassApi } from "./fetchGeoJsonFromOverpassApi";

export const generateFetchOsmObjects = ({
  title,
  acceptedGeometryTypes,
  selectors,
  filePath,
  territoryExtentBboxBufferInMeters,
}: {
  acceptedGeometryTypes: turf.GeometryTypes[];
  title: string;
  selectors: string[];
  filePath: string;
  territoryExtentBboxBufferInMeters?: number;
}): Command => async ({ logger }) => {
  logger.log(chalk.bold(`sources/osm: fetch ${title}`));

  const territoryExtent = await getTerritoryExtent();

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

  const geojsonData = await fetchGeojsonFromOverpassApi({
    logger,
    acceptedGeometryTypes,
    query,
    extent: territoryExtentBboxBufferInMeters
      ? createBboxFeature(territoryExtent, territoryExtentBboxBufferInMeters)
      : territoryExtent,
  });

  process.stdout.write(chalk.green("Saving..."));

  await writeFormattedJson(filePath, geojsonData);

  process.stdout.write(` Done: ${chalk.magenta(filePath)}\n`);
};
