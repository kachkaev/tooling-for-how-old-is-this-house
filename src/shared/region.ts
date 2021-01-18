import turf from "@turf/turf";
import envalid from "envalid";
import fs from "fs-extra";
import { load } from "js-yaml";
import path from "path";

import { customEnvalidReporter } from "./customEnvalidReporter";

export const getRegionDirPath = (): string => {
  const env = envalid.cleanEnv(
    process.env,
    { REGION_VAR_DIR: envalid.str({}) },
    { strict: true, reporter: customEnvalidReporter },
  );

  return path.resolve(env.REGION_VAR_DIR);
};

export interface RegionConfig {
  name?: string;

  extent?: {
    elementsToCombine?: Array<
      { type: "osmRelation"; relationId: number } | { type: never }
    >;
  };

  sources?: {
    mingkh?: {
      houseLists?: Array<
        | {
            regionUrl?: string;
            cityUrl?: string;
          }
        | undefined
      >;
    };
  };
}

export const getRegionConfigFilePath = (): string =>
  path.resolve(getRegionDirPath(), `region-config.yml`);

export const getRegionConfig = async (): Promise<RegionConfig> => {
  return load(await fs.readFile(getRegionConfigFilePath(), "utf8")) as any;
};

export const getRegionExtentFilePath = (): string =>
  path.resolve(getRegionDirPath(), `region-extent.geojson`);

export const getRegionExtent = async (): Promise<
  turf.Feature<turf.Polygon | turf.MultiPolygon>
> => {
  return fs.readJson(getRegionExtentFilePath());
};
