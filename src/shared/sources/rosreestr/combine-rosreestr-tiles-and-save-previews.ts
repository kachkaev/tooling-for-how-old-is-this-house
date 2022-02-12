import * as turf from "@turf/turf";
import chalk from "chalk";
import _ from "lodash";
import path from "node:path";
import { WriteStream } from "node:tty";

import { writeFormattedJson } from "../../helpers-for-json";
import { ensureTerritoryGitignoreContainsPreview } from "../../helpers-for-scripts";
import { combineRosreestrTiles } from "./combine-rosreestr-tiles";
import { getObjectDirPath } from "./helpers-for-paths";
import { RosreestrObjectType } from "./types";

export const combineRosreestrTilesAndSavePreviews = async ({
  objectType,
  output,
}: {
  objectType: RosreestrObjectType;
  output: WriteStream;
}): Promise<void> => {
  const { objectCenterFeatures, objectExtentFeatures, tileExtentFeatures } =
    await combineRosreestrTiles({
      objectType,
      output,
    });

  output.write(chalk.green("Saving...\n"));

  await ensureTerritoryGitignoreContainsPreview();

  for (const [features, name] of [
    [objectCenterFeatures, "Object centers"],
    [objectExtentFeatures, "Object extents"],
    [tileExtentFeatures, "Tile extents"],
  ] as const) {
    const filePath = path.resolve(
      getObjectDirPath(objectType),
      `preview--${_.kebabCase(name)}.geojson`,
    );

    await writeFormattedJson(
      filePath,
      turf.featureCollection<turf.Polygon | turf.Point>(features),
    );
    output.write(`${name} saved to ${chalk.magenta(filePath)}\n`);
  }
};
