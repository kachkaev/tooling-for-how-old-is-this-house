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

export type PropertyNameInDataToOmitSelector =
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
  property?: PropertyNameInDataToOmitSelector;
}

export interface ListRelevantPropertyVariants {
  (propertyNames: PropertyNameInDataToOmitSelector[]): PropertyVariant[];
}

export interface PickFromPropertyVariants<
  PropertiesToPick extends keyof MixedPropertyVariants
> {
  (payload: {
    listRelevantPropertyVariants: ListRelevantPropertyVariants;
    logger: Console;
    targetBuildArea: number;
  }): Pick<MixedPropertyVariants, PropertiesToPick> | undefined;
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
