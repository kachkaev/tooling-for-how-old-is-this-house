import type turf from "@turf/turf";

import { Tile } from "../../tiles";

/**
 * CCO: capital construction object (ru: ОКС)
 * lot: land lot (ru: Земельный участок)
 */
export type RosreestrObjectType = "cco" | "lot";

export interface RosreestrTileFeatureObject {
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

export interface RosreestrTileResponse {
  total: number;
  features: RosreestrTileFeatureObject[];
}

export interface RosreestrTileData {
  tile: Tile;
  fetchedAt: string;
  fetchedExtent: turf.Polygon;
  response: RosreestrTileResponse;
}

export type RosreestrTileExtentFeature = turf.Feature<
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
  fetchedAt: null;
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
  response: FailedResponseInInfoPage | SuccessfulFirObjectResponse;
}

export type InfoPageData = Array<
  InitialObjectInInfoPage | FetchedObjectInInfoPage
>;
