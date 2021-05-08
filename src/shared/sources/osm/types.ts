import * as turf from "@turf/turf";

export interface OsmFeatureProperties {
  id: string;
  [key: string]: string | undefined;
}

export type OsmFeature<G = turf.Polygon | turf.MultiPolygon> = turf.Feature<
  G,
  OsmFeatureProperties
>;

export type OsmFeatureCollection<
  G = turf.Polygon | turf.MultiPolygon
> = turf.FeatureCollection<G, OsmFeatureProperties> & {
  fetchedAt: string;
};

export type OsmRailwayGeometry = turf.LineString;

export type OsmRoadGeometry = turf.LineString;

export type OsmWaterObjectGeometry =
  | turf.LineString
  | turf.MultiLineString
  | turf.MultiPolygon
  | turf.Polygon;
