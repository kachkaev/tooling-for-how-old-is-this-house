import * as turf from "@turf/turf";
import axios from "axios";
import chalk from "chalk";
import _ from "lodash";
import osmToGeojson from "osmtogeojson";

import { filterFeaturesByGeometryType } from "../../helpersForGeometry";
import { serializeTime } from "../../helpersForJson";
import { getRegionExtent } from "../../region";

const regionExtentPlaceholder = "{{region_extent}}";

export const fetchGeojsonFromOverpassApi = async ({
  acceptedGeometryTypes,
  logger,
  query,
}: {
  acceptedGeometryTypes?: turf.GeometryTypes[];
  logger?: Console;
  query: string;
}): Promise<turf.FeatureCollection<turf.GeometryObject>> => {
  process.stdout.write(chalk.green("Preparing to make Overpass API query..."));

  let processedQuery = query;
  if (processedQuery.includes(regionExtentPlaceholder)) {
    const regionExtent = await getRegionExtent();
    if (!regionExtent.geometry) {
      throw new Error("Unexpected empty geometry in regionExtent");
    }
    if (regionExtent.geometry?.type === "MultiPolygon") {
      throw new Error(
        "Fetching OSM for multipolygons is not yet supported. Please amend the script.",
      );
    }

    const pointsInOuterRing = (regionExtent.geometry as turf.Polygon)
      .coordinates[0];

    if (!pointsInOuterRing) {
      throw new Error("Unexpected undefined outer ring in the polygon");
    }

    const serializedPolygonForOverpassApi = `poly:"${pointsInOuterRing
      .flatMap((point) => [point[1], point[0]])
      .join(" ")}"`;

    processedQuery = processedQuery.replace(
      new RegExp(regionExtentPlaceholder, "g"),
      serializedPolygonForOverpassApi,
    );
  }

  process.stdout.write(" Done.\n");

  process.stdout.write(chalk.green("Calling Overpass API..."));

  const osmData = (
    await axios.post(
      "https://overpass-api.de/api/interpreter",
      processedQuery,
      { responseType: "json" },
    )
  ).data;

  process.stdout.write(" Done.\n");
  process.stdout.write(chalk.green("Converting OSM data to geojson..."));

  const geojsonData = osmToGeojson(
    osmData,
  ) as turf.FeatureCollection<turf.GeometryObject>;

  process.stdout.write(" Done.\n");

  if (acceptedGeometryTypes) {
    geojsonData.features = filterFeaturesByGeometryType({
      features: geojsonData.features,
      acceptedGeometryTypes,
      logger,
    });
  }

  process.stdout.write(chalk.green("Post-processing..."));

  // Add metadata
  (geojsonData as any).properties = {
    copyright: "OpenStreetMap contributors",
    fetchedAt: serializeTime(),
    license: "ODbL",
  };

  // Reorder features by id (helps reduce diffs following subsequent fetches)
  geojsonData.features = _.orderBy(geojsonData.features, (feature) => {
    const [osmType, numericId] = `${feature.id}`.split("/");

    return `${osmType}/${(numericId ?? "").padStart(12, "0")}`;
  });

  // Remove feature ids given that there is a property with the same value
  geojsonData.features.forEach((feature) => {
    if (!feature.properties?.id) {
      throw new Error(`Unexpected missing id property in ${feature.id}`);
    }
    if (feature.properties?.id !== feature.id) {
      throw new Error(
        `feature.id (${feature.id}) does not match feature.properties.id (${feature.properties?.id})`,
      );
    }
    delete feature.id;
  });

  process.stdout.write(" Done.\n");

  return geojsonData;
};
