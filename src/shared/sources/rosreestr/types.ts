import type * as turf from "@turf/turf";

import { Tile } from "../../tiles";

/**
 * CCO: capital construction object (ru: ОКС)
 * lot: land lot (ru: Земельный участок)
 */
export type RosreestrObjectType = "cco" | "lot";

export interface RawRosreestrCenter {
  y: number;
  x: number;
}

export interface RawRosreestrExtent {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export type CompressedRosreesterCenter = [x: number, y: number];
export type CompressedRosreesterExtent = [
  xmin: number,
  ymin: number,
  xmax: number,
  ymax: number,
];

export interface RawRosreestrTileFeatureObject {
  center: RawRosreestrCenter;
  attrs: {
    address: string;
    cn: string;
    id: string;
  };
  extent: RawRosreestrExtent;
  sort: number;
  type: number;
}

export interface RawRosreestrTileResponse {
  total: number;
  features: RawRosreestrTileFeatureObject[];
}

export interface RosreestrTileFeatureObject
  extends Omit<RawRosreestrTileFeatureObject, "center" | "extent"> {
  center: CompressedRosreesterCenter;
  extent: CompressedRosreesterExtent;
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
  | "gap"
  | "handpicked"
  | "lotInTile";

export type EdgeCaseResponseInInfoPage = "flat" | "lot" | "notOks" | "void";

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
    addressNote?: string;
    objectAddress?: {
      addressNote?: string;
      mergedAddress?: string;
    };
    objectName?: string;
  };
  parcelData: {
    dateCost?: string;
    dateCreate?: string;
    dateRemove?: string;
    oksFlag: 0 | 1;
    oksFloors?: string;
    oksType?: OksType;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    oksUFloors?: string;
    oksYearBuilt?: string; // ‘завершение строительства’
    oksYearUsed?: string; // ‘ввод в эксплуатацию’
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
    attrs: {
      area_value: 240.0;
      cn: string;
      date_cost?: string;
      application_date?: unknown;
      kvartal?: string;
      height?: unknown;
      cc_date_approval?: unknown;
      year_used?: number;
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
    center?: RawRosreestrCenter;
    extent_parent: RawRosreestrExtent;
    extent?: RawRosreestrExtent;
    sort: number;
    type_parent: unknown;
    type: number;
  };
}

/* eslint-enable @typescript-eslint/naming-convention */

export type PkkFeatureResponse =
  | SuccessfulPkkFeatureResponse
  | {
      feature: null;
    };

export interface CompressedSuccessfulPkkFeatureResponse
  extends Omit<
    SuccessfulPkkFeatureResponse["feature"],
    "center" | "extent" | "extent_parent"
  > {
  center?: CompressedRosreesterCenter;
  extent?: CompressedRosreesterExtent;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  extent_parent?: CompressedRosreesterExtent;
}

export type FirResponseInInfoPageResponse =
  | EdgeCaseResponseInInfoPage
  | SuccessfulFirObjectResponseInInfoPage;

// used as fallback if FIR API returns 204
export type PkkResponseInInfoPageResponse =
  | EdgeCaseResponseInInfoPage
  | CompressedSuccessfulPkkFeatureResponse;

export interface InfoPageObject {
  cn: string;
  creationReason: CreationReasonForObjectInInfoPage;
  firFetchedAt: string | null;
  firResponse?: FirResponseInInfoPageResponse;
  pkkFetchedAt: string | null;
  pkkResponse?: PkkResponseInInfoPageResponse;
}

export type InfoPageData = InfoPageObject[];
