import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import axios from "axios";
import chalk from "chalk";
import qs from "qs";

import {
  serializeTime,
  writeFormattedJson,
} from "../../../shared/helpersForJson";
import {
  HouseListFile,
  HouseListResponse,
  loopThroughHouseLists,
} from "../../../shared/sources/mingkh";

const command: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/mingkh: Fetching house lists"));

  await loopThroughHouseLists(
    async ({ regionUrl, cityUrl, houseListFilePath }) => {
      const response = (
        await axios.post<HouseListResponse>(
          "https://dom.mingkh.ru/api/houses",
          qs.stringify({
            current: "1",
            rowCount: "-1",
            searchPhrase: "",
            ["region_url"]: regionUrl,
            ["city_url"]: cityUrl,
          }),
          { responseType: "json" },
        )
      ).data;

      const json: HouseListFile = {
        fetchedAt: serializeTime(),
        response,
      };

      await writeFormattedJson(houseListFilePath, json);

      process.stdout.write(
        ` Result saved to ${chalk.magenta(houseListFilePath)}\n`,
      );
    },
  );
};

autoStartCommandIfNeeded(command, __filename);

export default command;
