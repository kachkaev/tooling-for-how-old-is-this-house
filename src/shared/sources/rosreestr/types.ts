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

export type EdgeCaseResponseInInfoPage = "not-found" | "lot" | "flat";

/**
 * @example https://rosreestr.gov.ru/api/online/fir_object/58:29:4003005:1437
 */
export interface SuccessfulFirObjectResponse {
  objectId: string;
  type: string;
  regionKey: number;
  objectData: {
    id: string;
    // TODO: add more fields if they are needed
  };
  parcelData: {
    oksFlag: 0 | 1;
    oksType?: "building" | "construction" | "flat";
    oksYearBuilt: string;
    // TODO: add more fields if they are needed
  };
  oldNumbers: {
    // TODO: add more fields if they are needed
  };
}

export type SuccessfulResponseInInfoPage = Omit<
  SuccessfulFirObjectResponse,
  "oldNumbers"
>;

export type ResponseInInfoPageResponse =
  | EdgeCaseResponseInInfoPage
  | SuccessfulResponseInInfoPage;

export interface FetchedObjectInInfoPage {
  cn: string;
  creationReason: CreationReasonForObjectInInfoPage;
  fetchedAt: string;
  response: ResponseInInfoPageResponse;
}

export type InfoPageData = Array<
  InitialObjectInInfoPage | FetchedObjectInInfoPage
>;
