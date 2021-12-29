import chalk from "chalk";
import fs from "fs-extra";
import { WriteStream } from "tty";

import { getTerritoryConfig } from "../../territory";
import { getHouseListFilePath } from "./helpersForPaths";
import { HouseListFile } from "./types";

export const loopThroughHouseLists = async (
  callback: (payload: {
    regionUrl: string;
    cityUrl: string;
    houseListFilePath: string;
  }) => Promise<void>,
  output: WriteStream,
) => {
  const territoryConfig = await getTerritoryConfig();
  const houseListsToFetch = territoryConfig.sources?.mingkh?.houseLists ?? [];

  for (const houseListConfig of houseListsToFetch) {
    output.write(
      `  ${houseListsToFetch.indexOf(houseListConfig) + 1}/${
        houseListsToFetch.length
      }:`,
    );

    const { regionUrl, cityUrl } = houseListConfig || {};
    if (!regionUrl || !cityUrl) {
      output.write(chalk.red(" Skipping due to misconfig.\n"));
      continue;
    }

    const houseListFilePath = getHouseListFilePath(regionUrl, cityUrl);

    try {
      await callback({ regionUrl, cityUrl, houseListFilePath });
    } catch (e) {
      output.write(chalk.red(` Error: ${e}\n`));
    }
  }
};

/**
 * @param houseUrl e.g. /penzenskaya-oblast/penza/977878
 * @returns e.g. 977878
 */
const extractHouseIdFromUrl = (houseUrl: string): number => {
  const result = houseUrl.split("/")[3];
  if (!result) {
    throw new Error(`Cannot extract house id from url ${houseUrl}`);
  }

  return parseInt(result);
};

export const loopThroughRowsInHouseList = async (
  houseListFilePath: string,
  callback: (payload: { houseId: number; houseUrl: string }) => Promise<void>,
  output: WriteStream,
) => {
  const houseList: HouseListFile = await fs.readJson(houseListFilePath);

  const rows = houseList.response.rows;
  const numberOfRows = rows.length;
  const numberOfRowsCharCount = `${numberOfRows}`.length;

  output.write(` Found ${rows.length} houses in ${houseListFilePath}\n`);

  for (const row of rows) {
    const humanFriendlyIndex = `${rows.indexOf(row) + 1}`.padStart(
      numberOfRowsCharCount,
      "0",
    );
    output.write(`    ${humanFriendlyIndex}/${numberOfRows}:`);
    try {
      const houseId = extractHouseIdFromUrl(row.url);
      await callback({ houseId, houseUrl: row.url });
    } catch (e) {
      output.write(chalk.red(` Error: ${e}\n`));
    }
  }
};
