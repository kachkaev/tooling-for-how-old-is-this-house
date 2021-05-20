import * as turf from "@turf/turf";

import { GeocodeAddressResult } from "../geocoding";

export type OutputLayerRole = "base" | "patch";

export interface OutputLayerProperties {
  address?: string;
  buildingType?: string;
  /** Special field that is only applicable to layers in "manual" source */
  dataToIgnore?: string;
  completionDates?: string;
  derivedCompletionYear?: number;
  /** This field is present if coordinates are coming from another source via geocoding */
  externalGeometrySource?: string;
  floorCount?: number;
  id: string;
  knownAt: string;
  name?: string;
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
