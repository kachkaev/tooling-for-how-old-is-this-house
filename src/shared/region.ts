import turf from "@turf/turf";
import envalid from "envalid";
import fs from "fs-extra";
import { load } from "js-yaml";
import path from "path";

import { customEnvalidReporter } from "./customEnvalidReporter";

export const getRegionDir = (): string => {
  const env = envalid.cleanEnv(
    process.env,
    { REGION_VAR_DIR: envalid.str({}) },
    { strict: true, reporter: customEnvalidReporter },
  );

  return path.resolve(env.REGION_VAR_DIR);
};

export interface RegionConfig {
  extent?: {
    elementsToCombine?: Array<
      { type: "osmRelation"; relationId: number } | { type: never }
    >;
  };
  name?: string;
}

export const getRegionConfigPath = (): string =>
  path.resolve(getRegionDir(), `regionConfig.yml`);

export const getRegionConfig = async (): Promise<RegionConfig> => {
  return load(await fs.readFile(getRegionConfigPath(), "utf8")) as any;
};

export const getRegionExtentPath = (): string =>
  path.resolve(getRegionDir(), `regionExtent.geojson`);

export const getRegionExtent = async (): Promise<
  turf.Feature<turf.Polygon | turf.MultiPolygon>
> => {
  return fs.readJson(getRegionExtentPath());
};
