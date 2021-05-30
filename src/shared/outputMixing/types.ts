import * as turf from "@turf/turf";

import { OutputLayerProperties } from "../outputLayers";
import { OutputGeometry } from "../outputLayers/types";

export interface PropertyVariant extends OutputLayerProperties {
  id: string;
  source: string;
  /** Build area as derived from geometry (if geometry is polygon / multipolygon) */
  derivedBuildArea?: number;
  /** Distance to geometry in meters */
  distance: number;
}

export interface FilterPropertyVariant {
  (
    propertyVariant: PropertyVariant,
    propertyName?: keyof PropertyVariant,
  ): boolean;
}

export interface DataToOmitSelector {
  source: string;
  id?: string;
  property?: string;
}

// mixed output layers

export interface MixedOutputLayersFeatureProperties {
  geometrySource: string;
  geometryId: string;
  variants: PropertyVariant[];
}

export type MixedOutputLayersFeature = turf.Feature<
  OutputGeometry,
  MixedOutputLayersFeatureProperties
>;

export type MixedOutputLayersFeatureCollection = turf.FeatureCollection<
  OutputGeometry,
  MixedOutputLayersFeatureProperties
>;

// property variant mixing

export interface MixedPropertyVariants {
  address?: string;
  addressSource?: string;

  buildingType?: string;
  buildingTypeSource?: string;

  completionDates?: string;
  completionDatesSource?: string;

  floorCountAboveGround?: number;
  floorCountBelowGround?: number;
  floorCountSource?: string;

  geometryId: string;
  geometrySource: string;

  name?: string;
  nameSource?: string;

  photoAuthorName?: string;
  photoAuthorUrl?: string;
  photoSource?: string;
  photoUrl?: string;

  url?: string;
  urlSource?: string;

  wikipediaUrl?: string;
  wikipediaUrlSource?: string;

  /** The value is derived from address. TODO: replace address normalization with beautification */
  derivedBeautifiedAddress?: string;
  /** The value is derived from completionDates and is stored to simplify data visualization */
  derivedCompletionYear?: number;
}

export type MixedPropertyVariantsFeature = turf.Feature<
  OutputGeometry,
  MixedPropertyVariants
>;

export type MixedPropertyVariantsFeatureCollection = turf.FeatureCollection<
  OutputGeometry,
  MixedPropertyVariants
>;
