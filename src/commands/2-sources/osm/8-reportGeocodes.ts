import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";

import { reportGeocodesInOutputLayer } from "../../../shared/output/reportGeocodesInOutputLayer";
import { generateOsmOutputLayer } from "../../../shared/sources/osm";

export const reportGeocodes: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/osm: report geocodes"));

  const outputLayer = await generateOsmOutputLayer({ logger });

  await reportGeocodesInOutputLayer({ source: "osm", outputLayer, logger });
};

autoStartCommandIfNeeded(reportGeocodes, __filename);
