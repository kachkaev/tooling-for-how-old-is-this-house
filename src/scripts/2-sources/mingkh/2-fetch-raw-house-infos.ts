import axios from "axios";
import chalk from "chalk";
import fs from "fs-extra";
import path from "node:path";

import { prependCommentWithTimeToHtml } from "../../../shared/helpers-for-html";
import {
  getHouseFilePath,
  loopThroughHouseLists,
  loopThroughRowsInHouseList,
} from "../../../shared/source-mingkh";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("sources/mingkh: Fetching raw house infos\n"));

  await loopThroughHouseLists(async ({ houseListFilePath }) => {
    await loopThroughRowsInHouseList(
      houseListFilePath,
      async ({ houseUrl, houseId }) => {
        const rawHouseInfoFilePath = getHouseFilePath(houseId, "raw-info.html");
        if (await fs.pathExists(rawHouseInfoFilePath)) {
          output.write(
            chalk.gray(
              ` Skipped because file exists: ${rawHouseInfoFilePath}\n`,
            ),
          );

          return;
        }

        output.write(` Fetching...`);

        const { data: responseBody } = await axios.get<string>(
          `https://dom.mingkh.ru/${houseUrl}`,
        );

        await fs.ensureDir(path.dirname(rawHouseInfoFilePath));
        await fs.writeFile(
          rawHouseInfoFilePath,
          prependCommentWithTimeToHtml(responseBody),
          "utf8",
        );

        output.write(
          ` Result saved to ${chalk.magenta(rawHouseInfoFilePath)}\n`,
        );
      },
      output,
    );
  }, output);
};

await script();
