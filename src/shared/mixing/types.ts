import * as turf from "@turf/turf";

import { OutputLayerProperties } from "../outputLayers";
import { OutputGeometry } from "../outputLayers/types";
import { OmitNulls } from "../types";

export interface PropertyVariantWithNulls extends OutputLayerProperties {
  id: string;
  source: string;
  /** Build area as derived from geometry (if geometry is polygon / multipolygon) */
  derivedBuildArea?: number;
  /** Distance to geometry in meters */
  distance: number;
}

export type PropertyVariant = OmitNulls<PropertyVariantWithNulls>;

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
  (propertySelectors: PropertySelector[]): PropertyVariant[];
}

export interface PickFromPropertyVariants<
  PropertiesToPick extends keyof MixedPropertyVariants,
  ExtraPayload extends Record<string, unknown> = Record<string, unknown>,
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
  address?: null | string;
  addressSource?: null | string;

  architect?: null | string;
  architectSource?: null | string;

  buildingType?: null | string;
  buildingTypeSource?: null | string;

  completionTime?: null | string;
  completionTimeSource?: null | string;

  /** The value is derived from address */
  derivedBeautifiedAddress?: null | string;
  /** The value is derived from name */
  derivedBeautifiedName?: null | string;
  /** The value is derived from completionTime so that it is parsable by Geosemantica */
  derivedCompletionTimeForGeosemantica?: null | string;
  /** The value is derived from completionTime and is stored to simplify data visualization */
  derivedCompletionYear?: null | number;

  floorCountAboveGround?: null | number;
  floorCountBelowGround?: null | number;
  floorCountSource?: null | string;

  geometryId: string;
  geometrySource: string;

  mkrfUrl?: null | string;
  mkrfUrlSource?: null | string;

  name?: null | string;
  nameSource?: null | string;

  photoAuthorName?: null | string;
  photoAuthorUrl?: null | string;
  photoSource?: null | string;
  photoUrl?: null | string;

  style?: null | string;
  styleSource?: null | string;

  url?: null | string;
  urlSource?: null | string;

  // E.g. https://www.wikidata.org/wiki/Q3761480
  wikidataUrl?: null | string;
  wikidataUrlSource?: null | string;

  wikipediaUrl?: null | string;
  wikipediaUrlSource?: null | string;
}

export type MixedPropertyVariantsFeature = turf.Feature<
  OutputGeometry,
  MixedPropertyVariants
>;

export type MixedPropertyVariantsFeatureCollection = turf.FeatureCollection<
  OutputGeometry,
  MixedPropertyVariants
>;
