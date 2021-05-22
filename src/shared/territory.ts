import { CommandError } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import * as envalid from "envalid";
import fs from "fs-extra";
import { load } from "js-yaml";
import path from "path";

import { AddressNormalizationConfig } from "./addresses";
import { cleanEnv } from "./cleanEnv";

export type TerritoryExtent = turf.Feature<turf.Polygon>;

export const getTerritoryDirPath = (): string => {
  // TODO: Remove oldEnv after 2021-06-01
  const oldEnv = cleanEnv({
    TERRITORY_DATA_DIR: envalid.str({ default: "" }),
  });
  if (oldEnv.TERRITORY_DATA_DIR) {
    throw new CommandError(
      "Please open your .env.local file and replace TERRITORY_DATA_DIR with TERRITORY_DATA_DIR_PATH.",
    );
  }

  const env = cleanEnv({
    TERRITORY_DATA_DIR_PATH: envalid.str({}),
  });

  return path.resolve(env.TERRITORY_DATA_DIR_PATH);
};

export interface TerritoryConfig {
  name?: string;

  extent?: {
    elementsToCombine?: Array<
      | { type: "osmRelation"; relationId: number }
      | { type: "osmWay"; wayId: number }
      | { type: never }
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
    rosreestr?: {
      handpickedCnsForPageInfos?: string[];
    };
  };
  addressNormalization?: {
    defaultRegion?: string;
  };
}

export const getTerritoryConfigFilePath = (): string =>
  path.resolve(getTerritoryDirPath(), `territory-config.yml`);

export const getTerritoryConfig = async (): Promise<TerritoryConfig> => {
  return load(await fs.readFile(getTerritoryConfigFilePath(), "utf8")) as any;
};

export const getTerritoryExtentFilePath = (): string =>
  path.resolve(getTerritoryDirPath(), `territory-extent.geojson`);

export const getTerritoryExtent = async (): Promise<TerritoryExtent> => {
  const filePath = getTerritoryExtentFilePath();
  const territoryExtent = (await fs.readJson(filePath)) as turf.Feature;
  if (territoryExtent?.type !== "Feature") {
    throw new Error(
      `Expected ${filePath} to contain a geojson Feature, got: ${territoryExtent?.type}`,
    );
  }

  if (territoryExtent?.geometry?.type !== "Polygon") {
    throw new Error(
      `Expected ${filePath} to contain a geojson Feature with Polygon, got: ${territoryExtent?.geometry?.type}`,
    );
  }

  return territoryExtent as TerritoryExtent;
};

export const getAddressNormalizationConfig = async (): Promise<AddressNormalizationConfig> => {
  return (await getTerritoryConfig()).addressNormalization ?? {};
};
