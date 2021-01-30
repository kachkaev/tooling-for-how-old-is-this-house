import type turf from "@turf/turf";

import { Tile } from "../../tiles";

/**
 * CCO: capital construction object (ru: ОКС)
 * lot: land lot (ru: Земельный участок)
 */
export type FeatureType = "cco" | "lot";

export interface TileFeature {
  center: { x: number; y: number };
  attrs: {
    address: string;
    cn: string;
    id: string;
  };
  extent: {
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
  };
  sort: number;
  type: number;
}

export interface TileResponse {
  total: number;
  features: TileFeature[];
}

export interface TileData {
  tile: Tile;
  fetchedAt: string;
  fetchedExtent: turf.Polygon;
  response: TileResponse;
}

export type FeatureInCombinedTileExtentsData = turf.Feature<
  turf.Polygon,
  {
    tileId: string;
    fetchedAt: string;
    fetchedFeatureCount: number;
  }
>;

export type CenterInCombinedTileFeaturesData = turf.Feature<
  turf.Point,
  {
    address: string;
    cn: string;
    id: string;
    tileId: string;
  }
>;

export type ExtentInCombinedTileFeaturesData = turf.Feature<
  turf.Polygon,
  {
    cn: string;
  }
>;

export type CombinedTileExtentsData = turf.FeatureCollection<FeatureInCombinedTileExtentsData>;
export type CombinedTileFeaturesData = turf.FeatureCollection<
  CenterInCombinedTileFeaturesData | ExtentInCombinedTileFeaturesData
>;

export type DetailsPageItemCreationReason = "ccoInTile" | "lotInTile" | "gap";

export interface InitialItemInDetailsPage {
  cn: string;
  creationReason: DetailsPageItemCreationReason;
  fetchedAt: never;
  response: never;
}

export type FailedItemDetailsResponse = number;

/**
 * @example https://rosreestr.gov.ru/api/online/fir_object/58:29:4003005:1437
 */
export interface SuccessfulItemDetailsResponse {
  objectId: string;
  type: string;
  regionKey: number;
  objectData: {
    id: string;
    // TODO: add fields
  };
  parcelData: {
    oksYearBuilt: string;
    // TODO: add fields
  };
}

export interface FetchedItemInDetailsPage {
  cn: string;
  creationReason: DetailsPageItemCreationReason;
  fetchedAt: string;
  response: FailedItemDetailsResponse | SuccessfulItemDetailsResponse;
}

export type DetailsPage = Array<
  Array<InitialItemInDetailsPage | FetchedItemInDetailsPage>
>;
