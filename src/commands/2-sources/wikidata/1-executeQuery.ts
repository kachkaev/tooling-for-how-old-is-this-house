import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";

import { roughenBbox } from "../../../shared/helpersForGeometry";
import { getRegionExtent } from "../../../shared/region";

export const fetchHouseLists: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/wikidata: Execute query"));

  const regionExtent = await getRegionExtent();
  const roughBbox = roughenBbox(turf.bbox(regionExtent), 3);

  logger.log(roughBbox);

  // TODO: execute query and save it
  throw new Error("Command not implemented yet");
};

autoStartCommandIfNeeded(fetchHouseLists, __filename);
