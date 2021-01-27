import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import axios from "axios";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";

import { getSerialisedNow } from "../../../shared/helpersForJson";
import {
  deriveHouseFilePath,
  loopThroughHouseLists,
  loopThroughRowsInHouseList,
} from "../../../shared/sources/mingkh";

export const fetchRawHouseInfos: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/mingkh: Fetching raw house infos"));

  await loopThroughHouseLists(async ({ houseListFilePath }) => {
    await loopThroughRowsInHouseList(
      houseListFilePath,
      async ({ houseUrl, houseId }) => {
        const rawHouseInfoFilePath = deriveHouseFilePath(
          houseId,
          "raw-info.html",
        );
        if (await fs.pathExists(rawHouseInfoFilePath)) {
          process.stdout.write(
            chalk.gray(
              ` Skipped because file exists: ${rawHouseInfoFilePath}\n`,
            ),
          );

          return;
        }

        process.stdout.write(` Fetching...`);

        const responseBody = (
          await axios.get<string>(`https://dom.mingkh.ru/${houseUrl}`)
        ).data;

        await fs.ensureDir(path.dirname(rawHouseInfoFilePath));
        await fs.writeFile(
          rawHouseInfoFilePath,
          `<!-- fetchedAt: ${getSerialisedNow()} -->\n${responseBody}`,
          "utf8",
        );

        process.stdout.write(
          ` Result saved to ${chalk.magenta(rawHouseInfoFilePath)}\n`,
        );
      },
    );
  });
};

autoStartCommandIfNeeded(fetchRawHouseInfos, __filename);
