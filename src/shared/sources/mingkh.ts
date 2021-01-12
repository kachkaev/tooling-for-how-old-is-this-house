import chalk from "chalk";
import path from "path";

import { getRegionConfig, getRegionDirPath } from "../region";

export interface HouseListResponse {
  current: number;
  rowCount: number;
  rows: Array<{
    rownumber: string;
    address: string;
    square: string;
    year: string;
    floors: string;
    url: string;
    managerstartdate: string;
  }>;
}

export interface HouseListFile {
  fetchedAt: string;
  response: HouseListResponse;
}

export interface HouseInfo {
  id: number;
  address?: string;
  centerPoint?: [lon: number, lat: number];
  year?: number;
  numberOfFloors?: number;
  cadastralId?: string;
}

export interface HouseInfoFile {
  fetchedAt: string;
  parsedAt: string;
  response: HouseInfo;
}

export const getHouseListFilePath = (regionUrl: string, cityUrl: string) => {
  return path.resolve(
    getRegionDirPath(),
    "sources",
    "migkh",
    "houseLists",
    `${regionUrl}--${cityUrl}.json`,
  );
};

export const getHouseFilePath = (houseId: string, fileNameSuffix: string) => {
  const normalisedHouseId = houseId.padStart(7, "0");

  return path.resolve(
    getRegionDirPath(),
    "sources",
    "migkh",
    "houses",
    `${normalisedHouseId.substring(0, 4)}xxx`,
    `${normalisedHouseId}--${fileNameSuffix}`,
  );
};

export const loopThroughHouseLists = async (
  callback: (payload: {
    regionUrl: string;
    cityUrl: string;
    houseListFilePath: string;
  }) => Promise<void>,
) => {
  const regionConfig = await getRegionConfig();
  const houseListsToFetch = regionConfig.sources?.mingkh?.houseLists ?? [];

  for (const houseListConfig of houseListsToFetch) {
    process.stdout.write(
      `  ${houseListsToFetch.indexOf(houseListConfig) + 1}/${
        houseListsToFetch.length
      }:`,
    );

    const { regionUrl, cityUrl } = houseListConfig || {};
    if (!regionUrl || !cityUrl) {
      process.stdout.write(chalk.red(" Skipping due to misconfig.\n"));
      continue;
    }

    const houseListFilePath = getHouseListFilePath(regionUrl, cityUrl);

    try {
      await callback({ regionUrl, cityUrl, houseListFilePath });
    } catch (e) {
      process.stdout.write(chalk.red(` Error: ${e}\n`));
    }
  }
};

/**
 *
 * @param houseUrl e.g. /penzenskaya-oblast/penza/977878
 */
export const extractHouseIdFromUrl = (houseUrl: string): string => {
  const result = houseUrl.split("/")[3];
  if (!result) {
    throw new Error(`Cannot extract house id from url ${houseUrl}`);
  }

  return result;
};

export const notFilledIn = "Не заполнено";
