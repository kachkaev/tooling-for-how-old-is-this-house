import * as turf from "@turf/turf";
import _ from "lodash";

import { deepClean } from "../deepClean";
import { readFetchedOsmFeatureCollection } from "../sources/osm";
import { OsmFeatureProperties } from "../sources/osm/types";
import { TerritoryExtent } from "../territory";
import { generateGeographicContextExtent } from "./generateGeographicContextExtent";
import {
  GeographicContextFeature,
  GeographicContextFeatureCollection,
  GeographicContextFeatureProperties,
} from "./types";

const mapOsmPropertiesToLevel = ({
  level,
  bridge,
  tunnel,
}: OsmFeatureProperties): number | undefined => {
  const parsedLevel = parseInt(level ?? "");
  if (parsedLevel) {
    return parsedLevel;
  }

  if (bridge) {
    return 1;
  }
  if (tunnel) {
    return -1;
  }

  return undefined;
};
const mapOsmPropertiesToGeographicContextProperties = (
  geometryType: turf.GeometryTypes,
  properties: OsmFeatureProperties,
): GeographicContextFeatureProperties | undefined => {
  const { natural, highway, waterway, railway } = properties;
  const isArea = geometryType === "Polygon" || geometryType === "MultiPolygon";

  if (natural === "wetland" && isArea) {
    return { category: "wetland" };
  }

  if ((natural === "water" || waterway) && isArea) {
    return { category: "water" };
  }

  if (isArea) {
    return undefined;
  }

  const level = mapOsmPropertiesToLevel(properties);

  switch (waterway) {
    case undefined:
      break;
    case "river":
    case "riverbank":
    case "canal":
      return { category: "waterway", size: 1, level };
    default:
      return { category: "waterway", size: 0.7, level };
  }

  switch (highway) {
    case undefined:
      break;
    case "trunk":
    case "trunk_link":
      return { category: "roadway", size: 2, level };
    case "primary":
    case "primary_link":
    case "secondary":
    case "secondary_link":
      return { category: "roadway", size: 1, level };
    case "tertiary":
    case "tertiary_link":
      return { category: "roadway", size: 0.7, level };
    default:
      return undefined;
  }

  switch (railway) {
    case undefined:
      break;
    default:
      return {
        category: "railway",
        size: properties.usage === "main" ? 1 : 0.5,
        level,
      };
  }

  return undefined;
};

const categoryZIndexLookup: Record<
  GeographicContextFeatureProperties["category"],
  number
> = {
  geographicContextExtent: 0,
  wetland: 1,
  water: 2,
  waterway: 3,
  roadway: 4,
  railway: 5,
};

export const generateGeographicContext = async (
  territoryExtent: TerritoryExtent,
): Promise<GeographicContextFeatureCollection> => {
  const features: GeographicContextFeature[] = [];

  const geographicContextExtent = generateGeographicContextExtent(
    territoryExtent,
  );
  const clipBbox = turf.bbox(geographicContextExtent);

  const railways =
    (await readFetchedOsmFeatureCollection("railways"))?.features || [];
  const roads =
    (await readFetchedOsmFeatureCollection("roads"))?.features || [];
  const waterObjects =
    (await readFetchedOsmFeatureCollection("water-objects"))?.features || [];

  [...railways, ...roads, ...waterObjects].forEach((osmFeature) => {
    const properties = mapOsmPropertiesToGeographicContextProperties(
      osmFeature.geometry.type,
      osmFeature.properties,
    );
    if (properties) {
      features.push({
        type: "Feature",
        geometry: turf.simplify(turf.bboxClip(osmFeature.geometry, clipBbox), {
          tolerance: 0.000005,
        }).geometry,
        properties: deepClean(properties),
      });
    }
  });

  return {
    type: "FeatureCollection",
    features: [
      geographicContextExtent,
      ..._.orderBy(features, [
        ({ properties }) => ("level" in properties ? properties.level ?? 0 : 0),
        ({ properties }) => categoryZIndexLookup[properties.category],
      ]),
    ],
  };
};
