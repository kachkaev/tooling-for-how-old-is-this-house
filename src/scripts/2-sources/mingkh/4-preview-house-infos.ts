import chalk from "chalk";
import path from "path";

import { writeFormattedJson } from "../../../shared/helpersForJson";
import { ensureTerritoryGitignoreContainsPreview } from "../../../shared/helpersForScripts";
import {
  generateMingkhHouseInfoCollection,
  getMingkhDirPath,
} from "../../../shared/sources/mingkh";

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

script();
