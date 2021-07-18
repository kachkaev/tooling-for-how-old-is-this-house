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

/**
 * Used in data to omit field & when picking property variants
 */
export type PropertySelector =
  | Exclude<
      keyof PropertyVariant,
      | "dataToOmit"
      | "id"
      | "derivedBuildArea"
      | "derivedCompletionYear"
      | "distance"
      | "externalGeometrySource"
      | "floorCountAboveGround"
      | "floorCountBelowGround"
      | "knownAt"
      | "photoAuthorName"
      | "photoAuthorUrl"
      | "photoUrl"
    >
  | "photo"
  | "floorCount";

export interface DataToOmitSelector {
  source: string;
  id?: string;
  propertySelector?: PropertySelector;
}

export interface ListRelevantPropertyVariants {
  (propertyNames: PropertySelector[]): PropertyVariant[];
}

export interface PickFromPropertyVariants<
  PropertiesToPick extends keyof MixedPropertyVariants,
  ExtraPayload extends Record<string, unknown> = Record<string, unknown>
> {
  (
    payload: {
      listRelevantPropertyVariants: ListRelevantPropertyVariants;
      logger: Console;
      targetBuildArea: number;
    } & ExtraPayload,
  ): Pick<MixedPropertyVariants, PropertiesToPick> | undefined;
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

  /** The value is derived from address */
  derivedBeautifiedAddress?: string;
  /** The value is derived from name */
  derivedBeautifiedName?: string;
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
