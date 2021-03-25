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

export type OutputLayerFeatureWithGeometry = turf.Feature<
  turf.Polygon | turf.MultiPolygon,
  OutputLayerProperties
>;
export type OutputLayerFeatureWithoutGeometry = turf.Feature<
  undefined,
  OutputLayerProperties
>;
export type OutputLayerFeature =
  | OutputLayerFeatureWithGeometry
  | OutputLayerFeatureWithoutGeometry;

export type OutputLayer = turf.FeatureCollection<
  OutputLayerGeometry | undefined,
  OutputLayerProperties
> & {
  properties?: {
    knownAt?: string;
    originalSpellings?: string[];
  };
};

export type FindPointForNormalizedAddress = (
  normalizedAddress: string,
) => turf.Point | undefined;

export type GenerateOutputLayer = (payload: {
  logger?: Console;
  findPointForNormalizedAddress?: FindPointForNormalizedAddress;
}) => Promise<OutputLayer>;
