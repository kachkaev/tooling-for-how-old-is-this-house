import type turf from "@turf/turf";

import { Tile } from "../../tiles";

/**
 * CCO: capital construction object (ru: ОКС)
 * lot: land lot (ru: Земельный участок)
 */
export type ObjectType = "cco" | "lot";

export interface TileFeatureObject {
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
  features: TileFeatureObject[];
}

export interface TileData {
  tile: Tile;
  fetchedAt: string;
  fetchedExtent: turf.Polygon;
  response: TileResponse;
}

export type TileExtentFeature = turf.Feature<
  turf.Polygon,
  {
    tileId: string;
    fetchedAt: string;
    fetchedFeatureCount: number;
  }
>;

export type ObjectCenterFeature = turf.Feature<
  turf.Point,
  {
    address: string;
    cn: string;
    id: string;
    tileId: string;
  }
>;

export type ObjectExtentFeature = turf.Feature<
  turf.Polygon,
  {
    cn: string;
  }
>;

export type CreationReasonForObjectInInfoPage =
  | "ccoInTile"
  | "lotInTile"
  | "gap";

export interface InitialObjectInInfoPage {
  cn: string;
  creationReason: CreationReasonForObjectInInfoPage;
  fetchedAt?: never;
  response?: never;
}

export type FailedResponseInInfoPage = number;

/**
 * @example https://rosreestr.gov.ru/api/online/fir_object/58:29:4003005:1437
 */
export interface SuccessfulFirObjectResponse {
  objectId: string;
  type: string;
  regionKey: number;
  objectData: {
    id: string;
    // TODO: add fields
  };
  parcelData: {
    oksFlag: 0 | 1;
    oksYearBuilt: string;
    // TODO: add fields
  };
}

export interface FetchedObjectInInfoPage {
  cn: string;
  creationReason: CreationReasonForObjectInInfoPage;
  fetchedAt: string;
  response: FailedResponseInInfoPage | SuccessfulResponseInInfoPage;
}

export type InfoPageData = Array<
  InitialObjectInInfoPage | FetchedObjectInInfoPage
>;
