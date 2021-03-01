import * as turf from "@turf/turf";

export interface OutputLayerProperties {
  completionDates?: string;
  completionYear?: number;
  buildingType?: string;
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

export type FindPointForNormalizedAddress = (
  normalizedAddress: string,
) => turf.Point | undefined;

export type GenerateOutputLayer = (payload: {
  logger?: Console;
  findPointForNormalizedAddress?: FindPointForNormalizedAddress;
}) => Promise<OutputLayer>;
