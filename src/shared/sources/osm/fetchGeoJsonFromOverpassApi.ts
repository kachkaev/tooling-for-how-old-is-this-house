import * as turf from "@turf/turf";
import axios from "axios";
import axiosRetry from "axios-retry";
import chalk from "chalk";
import _ from "lodash";
import osmToGeojson from "osmtogeojson";
import { WriteStream } from "tty";

import { filterFeaturesByGeometryType } from "../../helpersForGeometry";
import { serializeTime } from "../../helpersForJson";
import { OsmFeatureCollection, OsmFeatureProperties } from "./types";

const extentPlaceholder = "{{extent}}";

const axiosInstance = axios.create();

axiosRetry(axiosInstance, {
  retries: 10,
  retryDelay: (retryCount) => 2000 + (retryCount ^ 1.5) * 1000,
  retryCondition: (error) =>
    !error.response?.status ||
    error.response.status === 429 ||
    error.response.status >= 500,
  shouldResetTimeout: true,
});

export const fetchGeojsonFromOverpassApi = async ({
  acceptedGeometryTypes,
  extent,
  output,
  query,
}: {
  acceptedGeometryTypes?: turf.GeometryTypes[];
  extent?: turf.Feature<turf.Polygon>;
  output?: WriteStream | undefined;
  query: string;
}): Promise<OsmFeatureCollection<turf.GeometryObject>> => {
  output?.write(chalk.green("Preparing to make Overpass API query..."));

  let processedQuery = query;
  if (processedQuery.includes(extentPlaceholder)) {
    if (!extent?.geometry) {
      throw new Error("Unexpected empty geometry in extent");
    }

    const pointsInOuterRing = extent.geometry.coordinates[0];

    if (!pointsInOuterRing) {
      throw new Error("Unexpected undefined outer ring in the polygon");
    }

    const serializedPolygonForOverpassApi = `poly:"${pointsInOuterRing
      .flatMap((point) => [point[1], point[0]])
      .join(" ")}"`;

    processedQuery = processedQuery.replace(
      new RegExp(extentPlaceholder, "g"),
      serializedPolygonForOverpassApi,
    );
  }

  output?.write(" Done.\n");
  output?.write(chalk.green("Calling Overpass API..."));

  const response = await axiosInstance.post<unknown>(
    "https://overpass-api.de/api/interpreter",
    processedQuery,
    { responseType: "json" },
  );

  const osmData = response.data;

  output?.write(" Done.\n");
  output?.write(chalk.green("Converting OSM data to geojson..."));

  // @ts-expect-error -- There is a type mismatch between turf and osmtogeojson
  const geojsonData: turf.FeatureCollection<
    turf.GeometryObject,
    OsmFeatureProperties
  > = osmToGeojson(osmData);

  output?.write(" Done.\n");
  output?.write(chalk.green("Post-processing..."));

  if (acceptedGeometryTypes) {
    geojsonData.features = filterFeaturesByGeometryType({
      features: geojsonData.features,
      acceptedGeometryTypes,
      output,
    });
  }

  // Reorder features by id (helps reduce diffs following subsequent fetches)
  geojsonData.features = _.orderBy(geojsonData.features, (feature) => {
    const [osmType, numericId] = `${feature.id!}`.split("/");

    return `${osmType!}/${(numericId ?? "").padStart(12, "0")}`;
  });

  // Remove feature ids given that there is a property with the same value
  const featuresWithoutId = geojsonData.features.map((feature) => {
    if (!feature.properties.id) {
      throw new Error(`Unexpected missing id property in ${feature.id!}`);
    }
    if (feature.properties.id !== feature.id) {
      throw new Error(
        `feature.id (${feature.id!}) does not match feature.properties.id (${
          feature.properties.id
        })`,
      );
    }

    const { id, ...rest } = feature;
    if (id) {
      return rest;
    }

    return feature;
  });

  output?.write(" Done.\n");

  return {
    type: "FeatureCollection",
    copyright: "OpenStreetMap contributors",
    fetchedAt: serializeTime(),
    license: "ODbL",
    features: featuresWithoutId,
  };
};
