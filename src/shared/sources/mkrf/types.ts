import * as turf from "@turf/turf";

export interface MkrfObjectData {
  nativeId: string;
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
    };
    nativeName: string;
  };
}

export interface MkrfObjectFile extends MkrfObjectData {
  dataDumpFileName: string;
  dataDumpProcessedAt: string;
}
