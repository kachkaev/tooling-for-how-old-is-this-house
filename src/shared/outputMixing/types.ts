import * as turf from "@turf/turf";

import { OutputLayerProperties } from "../outputLayers";
import { OutputGeometry } from "../outputLayers/types";

export interface PropertyVariantLookup extends OutputLayerProperties {
  source: string;
  distance: number; // distance to geometry in meters
}

export type FilterPropertyVariantLookup = (
  propertyVariantLookup: PropertyVariantLookup,
  propertyName?: keyof PropertyVariantLookup,
) => boolean;

export interface ParsedDataToOmitSelector {
  source: string;
  id?: string;
  property?: string;
}

// mixed output layers

export interface MixedOutputLayersFeatureProperties {
  geometrySource: string;
  variants: PropertyVariantLookup[];
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

export interface PropertyVariantLookupAggregate {
  id?: string;

  address?: string;
  addressSource?: string;

  buildingType?: string;
  buildingTypeSource?: string;

  completionDates?: string;
  completionDatesSource?: string;

  floorCount?: number;
  floorCountSource?: string;

  name?: string;
  nameSource?: string;

  photoAuthorName?: string;
  photoAuthorUrl?: string;
  photoSource?: string;
  photoUrl?: string;

  wikipediaUrl?: string;
  wikipediaUrlSource?: string;

  /** The value is derived from completionDates and is stored to simplify data visualization */
  derivedCompletionYear?: number;
  /** The value is derived from address. TODO: replace address normalization with beautification */
  derivedBeautifiedAddress?: string;
}

export interface MixedPropertyVariantsFeatureProperties
  extends PropertyVariantLookupAggregate {
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
