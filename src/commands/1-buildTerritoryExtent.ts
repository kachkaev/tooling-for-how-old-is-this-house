import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import axios from "axios";
import chalk from "chalk";
import sortKeys from "sort-keys";

import { multiUnion } from "../shared/helpersForGeometry";
import { serializeTime, writeFormattedJson } from "../shared/helpersForJson";
import {
  getTerritoryConfig,
  getTerritoryExtentFilePath,
} from "../shared/territory";

export const buildTerritoryExtent: Command = async ({ logger }) => {
  logger.log(chalk.bold("Building territory extent"));

  logger.log(chalk.green("Obtaining elements to combine..."));
  const territoryConfig = await getTerritoryConfig();
  const elementsToCombine = territoryConfig.extent?.elementsToCombine ?? [];

  const elementGeometries: turf.Geometry[] = [];
  for (const elementConfig of elementsToCombine) {
    process.stdout.write(
      `  ${elementsToCombine.indexOf(elementConfig) + 1}/${
        elementsToCombine.length
      }:`,
    );

    if (elementConfig.type === "osmRelation") {
      process.stdout.write(
        chalk.green(` Fetching OSM relation ${elementConfig.relationId}...`),
      );

      // Not visiting this link first may result in an invalid json
      await axios.get(
        `https://polygons.openstreetmap.fr/?id=${elementConfig.relationId}`,
      );

      const geoJson = (
        await axios.get<turf.GeometryCollection>(
          `https://polygons.openstreetmap.fr/get_geojson.py?id=${elementConfig.relationId}`,
          { responseType: "json" },
        )
      ).data;
      elementGeometries.push(...geoJson.geometries);
      process.stdout.write(" Done.\n");
    } else {
      process.stdout.write(chalk.red(" Skipping due to unknown type.\n"));
    }
  }

  process.stdout.write(chalk.green("Combining obtained elements..."));

  const featuresToUnion = elementGeometries
    .filter(
      (geometry): geometry is turf.Polygon | turf.MultiPolygon =>
        geometry.type === "Polygon" || geometry.type === "MultiPolygon",
    )
    .map((geometry) => turf.feature(geometry));

  const extent = multiUnion(featuresToUnion);

  process.stdout.write(" Done.\n");

  process.stdout.write(chalk.green(`Saving...`));

  if (!extent.properties) {
    extent.properties = {};
  }

  extent.properties.name = territoryConfig.name;
  extent.properties.createdAt = serializeTime();

  await writeFormattedJson(getTerritoryExtentFilePath(), sortKeys(extent));

  logger.log(` Result saved to ${chalk.magenta(getTerritoryExtentFilePath())}`);
};

autoStartCommandIfNeeded(buildTerritoryExtent, __filename);
