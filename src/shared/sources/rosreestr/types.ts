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

export type EdgeCaseResponseInInfoPage = "not-found" | "lot" | "flat";

export type OksType = "building" | "construction" | "flat" | "incomplete";

/**
 * @example https://rosreestr.gov.ru/api/online/fir_object/58:29:4003005:1437
 */
export interface SuccessfulFirObjectResponse {
  // TODO: add more fields if they are needed

  objectId: string;
  type: string;
  regionKey: number;
  objectData: {
    id: string;
    objectCn: string;
    objectAddress?: {
      mergedAddress?: string;
    };
  };
  parcelData: {
    oksFlag: 0 | 1;
    oksType?: OksType;
    oksYearBuilt?: string;
  };
  oldNumbers?: Record<string, unknown>;
}

export type SuccessfulFirObjectResponseInInfoPage = Omit<
  SuccessfulFirObjectResponse,
  "oldNumbers"
>;

/* eslint-disable @typescript-eslint/naming-convention */

/**
 * @example https://pkk.rosreestr.ru/api/features/5/58:24:70307:1113?date_format=%c&_=1614377817464
 */
export interface SuccessfulPkkFeatureResponse {
  feature: {
    extent_parent: {
      xmax: number;
      xmin: number;
      ymax: number;
      ymin: number;
    };
    center?: { y: number; x: number };
    attrs: {
      area_value: 240.0;
      cn: string;
      date_cost?: string;
      application_date?: unknown;
      kvartal?: string;
      height?: unknown;
      cc_date_approval?: unknown;
      year_used?: unknown;
      purpose?: string;
      fp?: null;
      name?: string;
      kvartal_cn?: string;
      underground_floors?: string;
      year_built?: string;
      floors?: string;
      cad_unit?: string;
      area_dev_type?: unknown;
      spread?: unknown;
      address?: string;
      depth?: unknown;
      proj_app?: unknown;
      area_unit?: string;
      volume?: unknown;
      statecd?: string;
      area_type?: string;
      oks_type?: OksType;
      id: string;
      area_dev_unit?: unknown;
      elements_constuct?: unknown[];
      cad_cost?: number;
      area_dev?: unknown;
      cc_date_entering?: string;
    };
    sort: number;
    type: number;
    type_parent: unknown;
    extent?: {
      xmax: number;
      xmin: number;
      ymax: number;
      ymin: number;
    };
  };
}

/* eslint-enable @typescript-eslint/naming-convention */

export type PkkFeatureResponse =
  | SuccessfulPkkFeatureResponse
  | {
      feature: null;
    };

export type SuccessfulPkkFeatureResponseInInfoPage = Omit<
  SuccessfulPkkFeatureResponse["feature"],
  "center" | "extent" | "extent_parent"
> & {
  center?: Readonly<[x: number, y: number]>;
  extent?: Readonly<[xmin: number, ymin: number, xmax: number, ymax: number]>;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  extent_parent?: Readonly<
    [xmin: number, ymin: number, xmax: number, ymax: number]
  >;
};

export type FirResponseInInfoPageResponse =
  | EdgeCaseResponseInInfoPage
  | SuccessfulFirObjectResponseInInfoPage;

// used as fallback if FIR API returns 204
export type PkkResponseInInfoPageResponse =
  | EdgeCaseResponseInInfoPage
  | SuccessfulPkkFeatureResponseInInfoPage;

export interface InfoPageObject {
  cn: string;
  creationReason: CreationReasonForObjectInInfoPage;
  firFetchedAt: string | null;
  firResponse?: FirResponseInInfoPageResponse;
  pkkFetchedAt: string | null;
  pkkResponse?: PkkResponseInInfoPageResponse;
}

export type InfoPageData = InfoPageObject[];
