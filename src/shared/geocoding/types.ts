export type Coordinates = [lot: number, lat: number];

export interface ReportedResolvedGeocode {
  normalizedAddress: string;
  coordinates: Coordinates;
  knownAt: string;
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
  fetchedAt: string,
];
export type EmptyGeocodeInDictionary = [];
export type GeocodeAddressRecord = Record<
  string,
  ResolvedGeocodeInDictionary | EmptyGeocodeInDictionary
>;
export type GeocodeDictionary = Record<string, GeocodeAddressRecord>;
export type GeocodeDictionaryLookup = Record<string, GeocodeDictionary>;

/* Shape of dictionary:
{
  "my address": {
    "source1": [x, y, "fetchedAt"],
    "source2": [x, y, "fetchedAt"]
  },
  "my address 2": {
    "source3": [x, y, "fetchedAt"]
  },
  "my address 3": {}
}
*/
