import axios from "axios";
import chalk from "chalk";
import qs from "qs";

import {
  serializeTime,
  writeFormattedJson,
} from "../../../shared/helpers-for-json";
import {
  HouseListFile,
  HouseListResponse,
  loopThroughHouseLists,
} from "../../../shared/source-mingkh";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("sources/mingkh: Fetching house lists\n"));

  await loopThroughHouseLists(
    async ({ regionUrl, cityUrl, houseListFilePath }) => {
      const { data: response } = await axios.post<HouseListResponse>(
        "https://dom.mingkh.ru/api/houses",
        qs.stringify({
          current: "1",
          rowCount: "-1",
          searchPhrase: "",
          ["region_url"]: regionUrl,
          ["city_url"]: cityUrl,
        }),
        {
          responseType: "json",
          transitional: {
            // eslint-disable-next-line @typescript-eslint/naming-convention -- external API
            silentJSONParsing: false, // Disables Object to string conversion if parsing fails
          },
        },
      );

      const json: HouseListFile = {
        fetchedAt: serializeTime(),
        response,
      };

      await writeFormattedJson(houseListFilePath, json);

      output.write(` Result saved to ${chalk.magenta(houseListFilePath)}\n`);
    },
    output,
  );
};

await script();
