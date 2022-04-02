import chalk from "chalk";

import { generateProcessTile } from "../../../shared/source-rosreestr";
import { getTerritoryExtent } from "../../../shared/territory";
import { processTiles } from "../../../shared/tiles";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("sources/rosreestr: Fetching tiles with lots\n"));

  await processTiles({
    initialZoom: 13,
    maxAllowedZoom: 24,
    output,
    processTile: generateProcessTile("lot"),
    territoryExtent: await getTerritoryExtent(),
  });
};

await script();
