/* eslint-disable @typescript-eslint/naming-convention */
import * as turf from "@turf/turf";

import { GeocodeAddressResult } from "../geocoding";

export type OutputLayerRole = "base" | "patch";

export interface OutputLayerProperties {
  address?: string;
  buildingType?: string;
  completionDates?: string;
  derivedCompletionYear?: number;
  /** This field is present if coordinates are coming from another source via geocoding */
  externalGeometrySource?: string;
  id: string;
  knownAt: string;
  name?: string;
  photoAuthorName?: string;
  photoAuthorUrl?: string;
  photoUrl?: string;
  url?: string;
  /** Special field that is only applicable to the "manual" layer */
  variantsToIgnore?: string;
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
  knownAt?: string;
  layerRole: OutputLayerRole;
};

export type ConfiguredGeocodeAddress = (
  address: string,
) => GeocodeAddressResult;

export type GenerateOutputLayer = (payload: {
  logger?: Console;
  geocodeAddress?: ConfiguredGeocodeAddress;
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
  address?: string;
  addressSource?: string;

  completionDates?: string;
  completionDatesSource?: string;

  /** The value is derived from completionDates and is stored to simplify data visualization */
  derivedCompletionYear?: number;
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

// upload

export type UploadFeatureProperties = {
  fid: number;
  r_adress?: string;
  r_architec?: string;
  r_copyrigh?: string;
  r_name?: string;
  r_photo_ur?: string;
  r_style?: string;
  r_url?: string;
  r_wikipedi?: string;
  r_year_int?: number;
  r_years_st?: string;
};

export type UploadFeature = turf.Feature<
  OutputGeometry,
  UploadFeatureProperties
>;

export type UploadFeatureCollection = turf.FeatureCollection<
  OutputGeometry,
  UploadFeatureProperties
>;
