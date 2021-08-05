import * as turf from "@turf/turf";

import { GeocodeAddressResult } from "../geocoding";

export type OutputLayerRole = "base" | "patch";

export interface OutputLayerProperties {
  address?: null | string;
  architect?: null | string;
  buildingType?: null | string;
  completionTime?: null | string;
  /** Only relevant to layers in "manual" sourc. @see README.md */
  dataToOmit?: null | string;
  derivedCompletionYear?: null | number;
  /** Number of square meters occupied by the building, as per docs (not geometry) */
  documentedBuildArea?: null | number;
  /** Present if coordinates are coming from another source via geocoding */
  externalGeometrySource?: null | string;
  floorCountAboveGround?: null | number;
  floorCountBelowGround?: null | number;
  id?: null | string;
  knownAt: string;
  mkrfUrl?: null | string;
  name?: null | string;
  photoAuthorName?: null | string;
  photoAuthorUrl?: null | string;
  photoUrl?: null | string;
  style?: null | string;
  url?: null | string;
  wikidataUrl?: null | string;
  wikipediaUrl?: null | string;
}

export type OutputLayerGeometry = turf.Polygon | turf.MultiPolygon | turf.Point;

export type OutputLayerFeatureWithGeometry = turf.Feature<
  OutputLayerGeometry,
  OutputLayerProperties
>;
export type OutputLayerFeatureWithoutGeometry = turf.Feature<
  null,
  OutputLayerProperties
>;
export type OutputLayerFeature =
  | OutputLayerFeatureWithGeometry
  | OutputLayerFeatureWithoutGeometry;

export type OutputLayer = turf.FeatureCollection<
  OutputLayerGeometry | null,
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

export type OutputGeometry = turf.Polygon | turf.MultiPolygon;
