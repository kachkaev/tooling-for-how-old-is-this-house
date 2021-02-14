import * as turf from "@turf/turf";

export interface OutputLayerParameters {
  normalizedAddress?: string;
}

export type OutputLayerGeometry = turf.Polygon | turf.MultiPolygon | turf.Point;

export type OutputLayer = turf.FeatureCollection<
  OutputLayerGeometry | undefined,
  OutputLayerParameters
>;
