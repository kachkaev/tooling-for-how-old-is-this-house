import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";
import fetch from "node-fetch";
import path from "path";

import { getRegionConfig } from "../../../shared/region";
import { getHouseListFilePath } from "../../../shared/sources/mingkh";

export const fetchHouseLists: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/mingkh: Fetching house lists"));

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

    const targetFileName = getHouseListFilePath(regionUrl, cityUrl);

    await fs.mkdirp(path.dirname(targetFileName));

    try {
      const response = await (
        await fetch(`https://dom.mingkh.ru/api/houses`, {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            current: "1",
            rowCount: "-1",
            searchPhrase: "",
            ["region_url"]: regionUrl,
            ["city_url"]: cityUrl,
          }),
        })
      ).json();

      const json = {
        createdAt: new Date().toUTCString(),
        response,
      };

      await fs.writeJson(targetFileName, json, { spaces: 2 });

      process.stdout.write(
        ` Result saved to ${chalk.magenta(targetFileName)}\n`,
      );
    } catch (e) {
      process.stdout.write(chalk.red(` Error: ${e}\n`));
    }
  }
};

autoStartCommandIfNeeded(fetchHouseLists, __filename);
