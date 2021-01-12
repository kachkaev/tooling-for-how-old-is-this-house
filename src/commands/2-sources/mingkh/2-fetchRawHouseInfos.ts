import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";
import fetch from "node-fetch";
import path from "path";

import {
  extractHouseIdFromUrl,
  getHouseFilePath,
  HouseListFile,
  loopThroughHouseLists,
} from "../../../shared/sources/mingkh";

export const fetchHouseInfos: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/mingkh: Fetching house infos"));

  await loopThroughHouseLists(async ({ houseListFilePath }) => {
    const houseList: HouseListFile = await fs.readJson(houseListFilePath);

    const rows = houseList.response.rows;
    const numberOfRows = rows.length;
    const numberOfRowsCharCount = `${numberOfRows}`.length;

    process.stdout.write(
      ` Found ${rows.length} houses in ${houseListFilePath}. Fetching...\n`,
    );

    for (const row of rows) {
      const humanFriendlyIndex = `${rows.indexOf(row) + 1}`.padStart(
        numberOfRowsCharCount,
        "0",
      );
      process.stdout.write(`    ${humanFriendlyIndex}/${numberOfRows}:`);
      try {
        const houseId = extractHouseIdFromUrl(row.url);
        const rawHouseInfoFilePath = getHouseFilePath(houseId, "rawInfo.html");
        if (await fs.pathExists(rawHouseInfoFilePath)) {
          process.stdout.write(
            chalk.gray(
              ` Skipped because file exists: ${rawHouseInfoFilePath}\n`,
            ),
          );
          continue;
        }

        process.stdout.write(` Fetching...`);

        const responseBody = await (
          await fetch(`https://dom.mingkh.ru/${row.url}`)
        ).text();

        await fs.ensureDir(path.dirname(rawHouseInfoFilePath));
        await fs.writeFile(
          rawHouseInfoFilePath,
          `<!-- fetchedAt: ${new Date().toUTCString()} -->\n${responseBody}`,
          "utf8",
        );

        process.stdout.write(
          ` Result saved to ${chalk.magenta(rawHouseInfoFilePath)}\n`,
        );
      } catch (e) {
        process.stdout.write(chalk.red(` Error: ${e}\n`));
      }
    }

    // const json = {
    //   createdAt: new Date().toUTCString(),
    //   response,
    // };
  });
};

autoStartCommandIfNeeded(fetchHouseInfos, __filename);
