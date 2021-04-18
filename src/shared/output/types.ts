import * as turf from "@turf/turf";

export type OutputLayerRole = "base" | "patch";

export interface OutputLayerProperties {
  buildingType?: string;
  completionDates?: string;
  completionYear?: number;
  id: string;
  knownAt: string;
  name?: string;
  normalizedAddress?: string;
  photoAuthorName?: string;
  photoAuthorUrl?: string;
  photoUrl?: string;
  sourcesToIgnore?: string; // Special field that is only applicable to the "manual" layer
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
  properties: {
    knownAt?: string;
    originalSpellings?: string[];
    layerRole: OutputLayerRole;
  };
};

export type FindPointForNormalizedAddress = (
  normalizedAddress: string,
) => turf.Point | undefined;

export type GenerateOutputLayer = (payload: {
  logger?: Console;
  findPointForNormalizedAddress?: FindPointForNormalizedAddress;
}) => Promise<OutputLayer>;

export interface PropertyLookupVariant extends OutputLayerProperties {
  source: string;
  distance: number; // distance to geometry in meters
}
export type OutputGeometry = turf.Polygon | turf.MultiPolygon;

// mixed output layers

export interface MixedOutputLayersFeatureProperties {
  geometrySource: string;
  variants: PropertyLookupVariant[];
}

export type MixedOutputLayersFeature = turf.Feature<
  OutputGeometry,
  MixedOutputLayersFeatureProperties
>;

export type MixedOutputLayersFeatureCollection = turf.FeatureCollection<
  OutputGeometry,
  MixedOutputLayersFeatureProperties
>;

// mixed property variants

export interface PropertyLookupVariantAggregate {
  completionDates?: string;
  completionDatesSource?: string;

  /** Derived from completionDates */
  completionYear?: number;
  completionYearSource?: string;

  normalizedAddress?: string;
  normalizedAddressSource?: string;
}

export interface MixedPropertyVariantsFeatureProperties
  extends PropertyLookupVariantAggregate {
  geometrySource: string;
}

export type MixedPropertyVariantsFeature = turf.Feature<
  OutputGeometry,
  MixedPropertyVariantsFeatureProperties
>;

export type MixedPropertyVariantsFeatureCollection = turf.FeatureCollection<
  OutputGeometry,
  MixedPropertyVariantsFeatureProperties
>;
