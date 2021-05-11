import chalk from "chalk";

import { combineRosreestrTiles } from "./combineRosreestrTiles";
import { RosreestrObjectByCn } from "./types";

export const loadObjectInTilesByCn = async (
  logger: Console,
): Promise<RosreestrObjectByCn> => {
  logger.log(chalk.green("Loading CCOs from tiles..."));
  const {
    objectCenterFeatures: ccoCentersInTiles,
  } = await combineRosreestrTiles({
    objectType: "cco",
    logger,
  });

  logger.log(chalk.green("Loading lots from tiles..."));
  const {
    objectCenterFeatures: lotCentersInTiles,
  } = await combineRosreestrTiles({
    objectType: "lot",
    logger,
  });

  process.stdout.write(chalk.green("Indexing by cadastral number..."));

  const objectByCn: RosreestrObjectByCn = {};

  for (const [objectType, objectFeatures] of [
    ["cco", ccoCentersInTiles],
    ["lot", lotCentersInTiles],
  ] as const) {
    for (const objectFeature of objectFeatures) {
      if (!objectFeature.properties?.cn) {
        throw new Error(
          `Found object ${objectType} without cadastral number: ${JSON.stringify(
            objectFeature,
          )}`,
        );
      }
      const objectWithSameCn = objectByCn[objectFeature.properties.cn];
      if (objectWithSameCn) {
        if (objectWithSameCn.objectType === objectType) {
          throw new Error(
            `Found object ${objectType} with an already used cadastral number for the same object type: ${JSON.stringify(
              objectFeature,
            )}`,
          );
        }

        logger.log(
          chalk.yellow(
            `Found object ${objectType} with an already used cadastral number for ${
              objectWithSameCn.objectType
            }: ${JSON.stringify(objectFeature)}. Ignoring lot.`,
          ),
        );
        if (objectWithSameCn.objectType === "cco") {
          continue;
        }
      }
      objectByCn[objectFeature.properties.cn] = {
        objectType,
        center: objectFeature,
      };
    }
  }

  logger.log(
    ` Loaded ${Object.keys(objectByCn).length} objects (${
      ccoCentersInTiles.length
    } CCOs and ${lotCentersInTiles.length} lots).`,
  );

  return objectByCn;
};
