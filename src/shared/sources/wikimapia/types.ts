import turf from "@turf/turf";

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
    id: string;
  }
>;

export type WikimapiaObjectExtentFeature = turf.Feature<
  turf.Polygon,
  {
    description?: string;
    id: string;
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
