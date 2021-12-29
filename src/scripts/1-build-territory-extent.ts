import * as turf from "@turf/turf";
import chalk from "chalk";
import dedent from "dedent";
import sortKeys from "sort-keys";

import { multiUnion } from "../shared/helpersForGeometry";
import { serializeTime, writeFormattedJson } from "../shared/helpersForJson";
import { ScriptError } from "../shared/helpersForScripts";
import { fetchGeojsonFromOverpassApi } from "../shared/sources/osm";
import {
  getTerritoryConfig,
  getTerritoryExtentFilePath,
} from "../shared/territory";

const output = process.stdout;

const script = async () => {
  output?.write(chalk.bold("Building territory extent\n"));

  output?.write(chalk.green("Obtaining elements to combine...\n"));
  const territoryConfig = await getTerritoryConfig();
  const elementsToCombine = territoryConfig.extent?.elementsToCombine ?? [];

  const elementGeometries: turf.GeometryObject[] = [];
  for (const elementConfig of elementsToCombine) {
    output.write(
      `  ${elementsToCombine.indexOf(elementConfig) + 1}/${
        elementsToCombine.length
      }:`,
    );

    if (
      elementConfig.type === "osmRelation" ||
      elementConfig.type === "osmWay"
    ) {
      let query: string;

      if (elementConfig.type === "osmRelation") {
        if (!(elementConfig.relationId > 0)) {
          output.write(
            chalk.yellow(
              ` Missing relationId (should be positive integer), skipping.\n`,
            ),
          );
          continue;
        }

        output.write(
          chalk.green(` Fetching OSM relation ${elementConfig.relationId}...`),
        );

        query = dedent`
          [out:json][timeout:25];
          (
            relation(id:${elementConfig.relationId});
          );
          out body;
          >;
          out skel qt;
        `;
      } else {
        if (!(elementConfig.wayId > 0)) {
          output.write(
            chalk.yellow(
              ` Missing wayId (should be positive integer), skipping.\n`,
            ),
          );
          continue;
        }

        output.write(
          chalk.green(` Fetching OSM way ${elementConfig.wayId}...`),
        );

        query = dedent`
          [out:json][timeout:25];
          (
            way(id:${elementConfig.wayId});
          );
          out body;
          >;
          out skel qt;
        `;
      }

      const geometryCollection = await fetchGeojsonFromOverpassApi({ query });

      geometryCollection.features.forEach((feature) => {
        const featureGeometry = feature.geometry as turf.Geometry;
        if (featureGeometry.type === "Polygon") {
          elementGeometries.push(feature.geometry);
        }
      });
      output.write(" Done.\n");
    } else {
      output.write(chalk.red(" Skipping due to unknown type.\n"));
    }
  }
  const featuresToUnion = elementGeometries
    .filter(
      (geometry): geometry is turf.Polygon | turf.MultiPolygon =>
        geometry.type === "Polygon" || geometry.type === "MultiPolygon",
    )
    .map((geometry) => turf.feature(geometry));

  if (!featuresToUnion.length) {
    throw new ScriptError(
      "Please configure territory-config.yml → extent → elementsToCombine so that the result contained at least one Polygon or MultiPolygon",
    );
  }

  output.write(chalk.green("Combining obtained elements..."));

  let extent = multiUnion(featuresToUnion);

  output.write(" Done.\n");
  output.write(chalk.green("Ensuring correct feature type..."));

  if (extent.geometry.type === "MultiPolygon") {
    const polygons = extent.geometry.coordinates.map(
      (coordinates) => turf.polygon(coordinates),
      extent.properties,
    );
    if (!polygons[0]) {
      throw new ScriptError(
        "Unexpected empty list of polygons in a multipolygon\n",
      );
    }
    if (polygons.length === 1) {
      extent = polygons[0];
      output.write(
        " Done: MultiPolygon with one Polygon converted to Polygon.\n",
      );
    } else {
      output.write(
        chalk.yellow(" Found a MultiPolygon, which is not expected.\n"),
      );
      output.write(
        chalk.yellow(
          "Some commands do not support MultiPolygon territories, so picking a Polygon with max area:\n",
        ),
      );
      const polygonAreas = polygons.map((polygon) => turf.area(polygon));
      const maxArea = Math.max(...polygonAreas);
      const maxAreaIndex = polygonAreas.indexOf(maxArea);
      polygonAreas.forEach((area, index) => {
        output.write(
          chalk.yellow(
            `${`${Math.round(area / 1000 / 100) / 10}`.padStart(8, " ")} km²${
              index === maxAreaIndex ? " → picked" : ""
            }\n`,
          ),
        );
      });
      extent = polygons[maxAreaIndex]!;
      output.write(
        chalk.yellow(
          "Please review your territory-config.yml. You might want to join the ‘islands’ or split them into independent territories.\n",
        ),
      );
    }
  } else {
    output.write(" Done.\n");
  }

  output.write(chalk.green(`Saving...`));

  if (!extent.properties) {
    extent.properties = {};
  }

  extent.properties.name = territoryConfig.name;
  extent.properties.createdAt = serializeTime();

  await writeFormattedJson(getTerritoryExtentFilePath(), sortKeys(extent));

  output.write(
    ` Result saved to ${chalk.magenta(getTerritoryExtentFilePath())}\n`,
  );
};

script();
