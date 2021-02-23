import * as turf from "@turf/turf";

export interface MkrfObjectData {
  nativeId: string;
  modified: string;
  data: {
    general: {
      photo?: {
        url: string;
        preview: string;
        title: string;
      };
      address?: {
        fullAddress: string;
        mapPosition: turf.Point;
      };
      additionalCoordinates?: turf.MultiPoint[];
      createDate?: string;
      typologies?: Array<{ type: string; value: string }>;
      isActual: boolean;
    };
    nativeName: string;
  };
}

export interface MkrfObjectFile extends MkrfObjectData {
  dataDumpFileName: string;
  dataDumpProcessedAt: string;
}
