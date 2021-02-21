import * as turf from "@turf/turf";
import envalid from "envalid";
import path from "path";

import { customEnvalidReporter } from "../customEnvalidReporter";
import { GenerateOutputLayer } from "../output";
import { getRegionDirPath } from "../region";

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

export const getMkrfJsonsDumpFilePath = (): string => {
  const env = envalid.cleanEnv(
    process.env,
    { MKRF_JSONS_DUMP_FILE_PATH: envalid.str({}) },
    { strict: true, reporter: customEnvalidReporter },
  );

  return path.resolve(env.MKRF_JSONS_DUMP_FILE_PATH);
};

export const getMkrfDirPath = () => {
  return path.resolve(getRegionDirPath(), "sources", "mkrf");
};

export const getMkrfObjectFilePath = (nativeId: string): string => {
  const noramlizedId = nativeId.padStart(6, "0");

  return path.resolve(
    getMkrfDirPath(),
    "objects",
    `${noramlizedId}--info.json`,
  );
};

export const generateMkrfOutputLayer: GenerateOutputLayer = () => {
  return turf.featureCollection([]);
};
