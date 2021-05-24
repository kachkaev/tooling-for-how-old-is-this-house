import * as turf from "@turf/turf";

import { Tile } from "../../tiles";

export type ProcessedWikimapiaTileResponse = Array<
  turf.Feature<turf.GeometryCollection>
>;

export interface WikimapiaTileData {
  tile: Tile;
  fetchedAt: string;
  response: ProcessedWikimapiaTileResponse;
}

export type WikimapiaObjectPointFeature = turf.Feature<
  turf.Point,
  {
    description?: string;
    wikimapiaId: number;
  }
>;

export type WikimapiaObjectExtentFeature = turf.Feature<
  turf.Polygon,
  {
    description?: string;
    wikimapiaId: number;
  }
>;

export type WikimaiaTileExtentFeature = turf.Feature<
  turf.Polygon,
  {
    tileId: string;
    fetchedAt: string;
    fetchedFeatureCount: number;
  }
>;

export interface WikimapiaObjectPhotoInfo {
  url: string;
  userId: number;
  userName: string;
}

export interface WikimapiaObjectInfo {
  wikimapiaId: number;
  photos?: WikimapiaObjectPhotoInfo[];
  completionDates?: string;
  name?: string;
}

export interface WikimapiaObjectInfoFile {
  fetchedAt: string;
  parsedAt: string;
  data: WikimapiaObjectInfo;
}
