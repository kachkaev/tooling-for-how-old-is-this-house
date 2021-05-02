import * as turf from "@turf/turf";

import { Point2dCoordinates } from "../helpersForGeometry";

export interface ReportedResolvedGeocode {
  address: string;
  coordinates: Point2dCoordinates;
  knownAt?: string;
  /** if multiple addresses are normalized the same way, the algorithm picks one with the highest weight (e.g. area) */
  weight: number;
}

export interface ReportedUnresolvedGeocode {
  address: string;
  knownAt?: string;
}

export type ReportedGeocode =
  | ReportedUnresolvedGeocode
  | ReportedResolvedGeocode;

export type ResolvedGeocodeInDictionary = [
  lon: number,
  lat: number,
  knownAt?: string,
];

export type EmptyGeocodeInDictionary = [];
export type GeocodeAddressRecord = Record<
  string,
  ResolvedGeocodeInDictionary | EmptyGeocodeInDictionary
>;
export type GeocodeDictionary = Record<string, GeocodeAddressRecord>;
export type GeocodeDictionaryLookup = Record<string, GeocodeDictionary>;

export type GeocodeAddressResult =
  | { source: string; location: turf.Point; knownAt?: string }
  | undefined;
