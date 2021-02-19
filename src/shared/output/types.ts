import * as turf from "@turf/turf";

export interface OutputLayerProperties {
  completionDates?: string;
  completionYear?: number;
  id: string;
  knownAt: string;
  name?: string;
  normalizedAddress?: string;
  photoAuthorName?: string;
  photoAuthorUrl?: string;
  photoUrl?: string;
  url?: string;
  wikipediaUrl?: string;
}

export type OutputLayerGeometry = turf.Polygon | turf.MultiPolygon | turf.Point;

export type OutputLayer = turf.FeatureCollection<
  OutputLayerGeometry | undefined,
  OutputLayerProperties
>;

export type GenerateOutputLayer = (payload: {
  logger?: Console;
}) => Promise<OutputLayer>;
