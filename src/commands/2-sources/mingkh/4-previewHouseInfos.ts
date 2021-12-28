import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import path from "path";

import { ensureTerritoryGitignoreContainsPreview } from "../../../shared/helpersForCommands";
import { writeFormattedJson } from "../../../shared/helpersForJson";
import {
  generateMingkhHouseInfoCollection,
  getMingkhDirPath,
} from "../../../shared/sources/mingkh";

const command: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/mingkh: Previewing house infos as geojson"));

  const houseInfoCollection = await generateMingkhHouseInfoCollection({
    logger,
  });

  await ensureTerritoryGitignoreContainsPreview();

  const previewHouseInfosFilePath = path.resolve(
    getMingkhDirPath(),
    "preview--house-infos.geojson",
  );
  await writeFormattedJson(previewHouseInfosFilePath, houseInfoCollection);

  process.stdout.write(
    ` Result saved to ${chalk.magenta(previewHouseInfosFilePath)}\n`,
  );
};

autoStartCommandIfNeeded(command, __filename);

export default command;
