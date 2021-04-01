import turf from "@turf/turf";
import * as envalid from "envalid";
import fs from "fs-extra";
import { load } from "js-yaml";
import path from "path";

import { cleanEnv } from "./cleanEnv";

export const gettTerritoryDirPath = (): string => {
  const env = cleanEnv({
    TERRITORY_DATA_DIR: envalid.str({}),
  });

  return path.resolve(env.TERRITORY_DATA_DIR);
};

export interface TerritoryConfig {
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
    mkrf?: {
      fallbackAddressSelectorsForObjectsWithoutGeometry?: string[] | string[][];
    };
  };
}

export const getTerritoryConfigFilePath = (): string =>
  path.resolve(gettTerritoryDirPath(), `territory-config.yml`);

export const getTerritoryConfig = async (): Promise<TerritoryConfig> => {
  return load(await fs.readFile(getTerritoryConfigFilePath(), "utf8")) as any;
};

export const getTerritoryExtentFilePath = (): string =>
  path.resolve(gettTerritoryDirPath(), `territory-extent.geojson`);

export const getTerritoryExtent = async (): Promise<
  turf.Feature<turf.Polygon | turf.MultiPolygon>
> => {
  return fs.readJson(getTerritoryExtentFilePath());
};
