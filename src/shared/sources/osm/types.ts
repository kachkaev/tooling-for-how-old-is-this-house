import * as turf from "@turf/turf";

export interface OsmFeatureProperties {
  id: string;
  name?: string;
}

export type OsmFeature<G = turf.Polygon | turf.MultiPolygon> = turf.Feature<
  G,
  OsmFeatureProperties
>;

export type OsmFeatureCollection<
  G = turf.Polygon | turf.MultiPolygon
> = turf.FeatureCollection<G, OsmFeatureProperties>;
