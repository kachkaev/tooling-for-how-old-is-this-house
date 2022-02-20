import chalk from "chalk";
import path from "node:path";

import { writeFormattedJson } from "../../../shared/helpers-for-json";
import { ensureTerritoryGitignoreContainsPreview } from "../../../shared/helpers-for-scripts";
import {
  generateMingkhHouseInfoCollection,
  getMingkhDirPath,
} from "../../../shared/source-mingkh";

const output = process.stdout;

const script = async () => {
  output.write(
    chalk.bold("sources/mingkh: Previewing house infos as geojson\n"),
  );

  const houseInfoCollection = await generateMingkhHouseInfoCollection({
    output,
  });

  await ensureTerritoryGitignoreContainsPreview();

  const previewHouseInfosFilePath = path.resolve(
    getMingkhDirPath(),
    "preview--house-infos.geojson",
  );
  await writeFormattedJson(previewHouseInfosFilePath, houseInfoCollection);

  output.write(
    ` Result saved to ${chalk.magenta(previewHouseInfosFilePath)}\n`,
  );
};

await script();
