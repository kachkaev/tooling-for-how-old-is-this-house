import { Point2dCoordinates } from "../helpersForGeometry";

export interface ReportedResolvedGeocode {
  normalizedAddress: string;
  coordinates: Point2dCoordinates;
  knownAt?: string;
}

export interface ReportedUnresolvedGeocode {
  normalizedAddress: string;
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
