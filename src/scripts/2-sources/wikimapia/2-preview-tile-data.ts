import * as turf from "@turf/turf";
import chalk from "chalk";
import _ from "lodash";
import path from "path";

import { writeFormattedJson } from "../../../shared/helpersForJson";
import { ensureTerritoryGitignoreContainsPreview } from "../../../shared/helpersForScripts";
import { getWikimapiaDirPath } from "../../../shared/sources/wikimapia";
import { combineWikimapiaTiles } from "../../../shared/sources/wikimapia/combineWikimapiaTiles";

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
