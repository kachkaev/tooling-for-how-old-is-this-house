import * as turf from "@turf/turf";
import chalk from "chalk";
import _ from "lodash";
import path from "node:path";

import { writeFormattedJson } from "../../../shared/helpers-for-json";
import { ensureTerritoryGitignoreContainsPreview } from "../../../shared/helpers-for-scripts";
import { getWikimapiaDirPath } from "../../../shared/source-wikimapia";
import { combineWikimapiaTiles } from "../../../shared/source-wikimapia/combine-wikimapia-tiles";

const output = process.stdout;

const script = async () => {
  output.write(chalk.bold("sources/wikimapia: Previewing tile data\n"));

  const { objectPointFeatures, objectExtentFeatures, tileExtentFeatures } =
    await combineWikimapiaTiles({ output });

  output.write(chalk.green("Saving...\n"));

  await ensureTerritoryGitignoreContainsPreview();

  for (const [features, name] of [
    [objectPointFeatures, "Object points"],
    [objectExtentFeatures, "Object extents"],
    [tileExtentFeatures, "Tile extents"],
  ] as const) {
    const filePath = path.resolve(
      getWikimapiaDirPath(),
      `preview--${_.kebabCase(name)}.geojson`,
    );

    await writeFormattedJson(
      filePath,
      turf.featureCollection<turf.Polygon | turf.Point>(features),
    );
    output.write(`${name} saved to ${chalk.magenta(filePath)}\n`);
  }
};

await script();
