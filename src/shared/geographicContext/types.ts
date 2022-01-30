import * as turf from "@turf/turf";

export type GeographicContextWayCategory = "roadway" | "railway" | "waterway";
export type GeographicContextWayLevel = number | undefined;
export type GeographicContextWaySize = number;

export interface GeographicContextWayProperties {
  category: GeographicContextWayCategory;
  level?: GeographicContextWayLevel;
  name?: string | undefined;
  relativeSize: GeographicContextWaySize;
}

export type GeographicContextFeatureProperties =
  | { category: "geographicContextExtent" }
  | { category: "water" }
  | { category: "wetland" }
  | GeographicContextWayProperties;

export type GeographicContextFeatureGeometry =
  | turf.MultiLineString
  | turf.LineString
  | turf.Polygon
  | turf.MultiPolygon;

export type GeographicContextFeature = turf.Feature<
  GeographicContextFeatureGeometry,
  GeographicContextFeatureProperties
>;

export type GeographicContextFeatureCollection = turf.FeatureCollection<
  GeographicContextFeatureGeometry,
  GeographicContextFeatureProperties
>;
