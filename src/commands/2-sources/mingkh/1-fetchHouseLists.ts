import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import axios from "axios";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

import {
  HouseListFile,
  HouseListResponse,
  loopThroughHouseLists,
} from "../../../shared/sources/mingkh";

export const fetchHouseLists: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/mingkh: Fetching house lists"));

  await loopThroughHouseLists(
    async ({ regionUrl, cityUrl, houseListFilePath }) => {
      await fs.mkdirp(path.dirname(houseListFilePath));

      const response = (
        await axios.post<HouseListResponse>(
          "https://dom.mingkh.ru/api/houses",
          {
            current: "1",
            rowCount: "-1",
            searchPhrase: "",
            ["region_url"]: regionUrl,
            ["city_url"]: cityUrl,
          },
          {
            headers: { "content-type": "application/x-www-form-urlencoded" },
            responseType: "json",
          },
        )
      ).data;

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

autoStartCommandIfNeeded(fetchHouseLists, __filename);
