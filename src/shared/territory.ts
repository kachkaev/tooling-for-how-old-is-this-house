import { CommandError } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import * as envalid from "envalid";
import fs from "fs-extra";
import { load } from "js-yaml";
import path from "path";

import { AddressHandlingConfig, RawAddressHandlingConfig } from "./addresses";
import { compileAddressHandlingConfig } from "./addresses/helpersForWordReplacements";
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
    wikivoyage?: {
      pagesToFetch?: string[];
    };
  };
  addressHandling?: RawAddressHandlingConfig;
  [rest: string]: unknown;
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

export const getTerritoryAddressHandlingConfig = async (
  logger: Console | undefined,
): Promise<AddressHandlingConfig> => {
  const territoryConfig = await getTerritoryConfig();

  // TODO: Remove after 2022-01-01
  if (territoryConfig["addressNormalization"]) {
    throw new CommandError(
      `Data in ${getTerritoryConfigFilePath()} is out of sync with the latest tooling. Please replace addressNormalization with addressHandling.`,
    );
  }

  const rawAddressHandling = territoryConfig.addressHandling ?? {};

  // TODO: Check user input. e.g.:
  // if (wordReplacements !== undefined && !(wordReplacements instanceof Array)) {
  //   reportIssue?.(
  //     "Expected wordReplacements to be an array. Ignoring this field",
  //   );

  //   return rest;
  // }

  return compileAddressHandlingConfig(rawAddressHandling, (issue) =>
    logger?.log(
      chalk.yellow(`territory-config.yml → addressHandling: ${issue}`),
    ),
  );
};
