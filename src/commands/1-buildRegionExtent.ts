import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import axios from "axios";
import chalk from "chalk";

import { getSerialisedNow, writeFormattedJson } from "../shared/helpersForJson";
import { getRegionConfig, getRegionExtentFilePath } from "../shared/region";

export const buildRegionExtent: Command = async ({ logger }) => {
  logger.log(chalk.bold("Building region extent"));

  logger.log(chalk.green("Obtaining elements to combine..."));
  const regionConfig = await getRegionConfig();
  const elementsToCombine = regionConfig.extent?.elementsToCombine ?? [];

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
      (geometry) =>
        geometry.type === "Polygon" || geometry.type === "MultiPolygon",
    )
    .map((geometry) => turf.feature(geometry));

  const extent = turf.union(
    ...(featuresToUnion as Array<turf.Feature<turf.Polygon>>),
  );

  process.stdout.write(" Done.\n");

  process.stdout.write(chalk.green(`Saving...`));

  if (!extent.properties) {
    extent.properties = {};
  }

  extent.properties.name = regionConfig.name;
  extent.properties.createdAt = getSerialisedNow();

  await writeFormattedJson(getRegionExtentFilePath(), extent);

  logger.log(` Result saved to ${chalk.magenta(getRegionExtentFilePath())}`);
};

autoStartCommandIfNeeded(buildRegionExtent, __filename);
