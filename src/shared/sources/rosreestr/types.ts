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
