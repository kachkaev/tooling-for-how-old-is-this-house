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

export type InfoPageItemCreationReason = "ccoInTile" | "lotInTile" | "gap";

export interface InitialItemInInfoPage {
  cn: string;
  creationReason: InfoPageItemCreationReason;
  fetchedAt?: never;
  response?: never;
}

export type FailedItemInfoResponse = number;

/**
 * @example https://rosreestr.gov.ru/api/online/fir_object/58:29:4003005:1437
 */
export interface SuccessfulItemInfoResponse {
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

export interface FetchedItemInInfoPage {
  cn: string;
  creationReason: InfoPageItemCreationReason;
  fetchedAt: string;
  response: FailedItemInfoResponse | SuccessfulItemInfoResponse;
}

export type InfoPageData = Array<InitialItemInInfoPage | FetchedItemInInfoPage>;
