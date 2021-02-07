/* eslint-disable @typescript-eslint/no-unused-vars */

export type Position = [lot: number, lat: number];

export interface ReportedUnresolvedGeocode {
  normalizedAddress: string;
}

export interface ReportedResolvedGeocode {
  normalizedAddress: string;
  position: Position;
  fetchedAt: string;
}

export type ReportedGeocode = ReportedResolvedGeocode | ReportedResolvedGeocode;

export type GeocodeSourceRecord = [lon: number, lat: number, fetchedAt: string];
export type GeocodeAddressRecord = Record<string, GeocodeSourceRecord>;
export type GeocodeDictionary = Record<string, GeocodeAddressRecord>;

/*
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

export const reportGeocodes = async (
  source: string,
  reportedGeocodes: ReportedGeocode[],
): Promise<void> => {
  // TODO: implement
};

export const resolvePosition = async (
  normalizedAddress: string,
  sources?: string[],
): Promise<Position | undefined> => {
  // TODO: implement
  return undefined;
};

export const listNormalizedAddressesWithoutPosition = async (): Promise<
  string[]
> => {
  return [];
};
