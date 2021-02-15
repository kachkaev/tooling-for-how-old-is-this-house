import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";

import { writeFormattedJson } from "../../../shared/helpersForJson";
import {
  generateOsmOutputLayer,
  getOsmOutputLayerFilePath,
} from "../../../shared/sources/osm";

export const reportGeocodes: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/osm: extract output layer"));

  const outputLayer = await generateOsmOutputLayer({ logger });

  await writeFormattedJson(getOsmOutputLayerFilePath(), outputLayer);
};

autoStartCommandIfNeeded(reportGeocodes, __filename);
