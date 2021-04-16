import * as turf from "@turf/turf";

export interface OsmFeatureProperties {
  id: string;
  [key: string]: string;
}

export type OsmFeature<G = turf.Polygon | turf.MultiPolygon> = turf.Feature<
  G,
  OsmFeatureProperties
>;

export type OsmFeatureCollection<
  G = turf.Polygon | turf.MultiPolygon
> = turf.FeatureCollection<G, OsmFeatureProperties> & {
  properties: { fetchedAt: string };
};

export type OsmWaterObjectGeometry =
  | turf.LineString
  | turf.MultiLineString
  | turf.MultiPolygon
  | turf.Polygon;

export type OsmRoadGeometry = turf.LineString;
