import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";
import fetch from "node-fetch";
import path from "path";

import {
  HouseListFile,
  loopThroughHouseLists,
} from "../../../shared/sources/mingkh";

export const fetchHouseDetails: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/mingkh: Fetching house details"));

  await loopThroughHouseLists(
    async ({ regionUrl, cityUrl, houseListFilePath }) => {
      await fs.mkdirp(path.dirname(houseListFilePath));

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

      const json: HouseListFile = {
        fetchedAt: new Date().toUTCString(),
        response,
      };

      await fs.writeJson(houseListFilePath, json, { spaces: 2 });

      process.stdout.write(
        ` Result saved to ${chalk.magenta(houseListFilePath)}\n`,
      );
    },
  );
};

autoStartCommandIfNeeded(fetchHouseDetails, __filename);
