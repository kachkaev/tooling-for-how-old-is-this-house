import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import sortKeys from "sort-keys";

import { processFiles } from "../../processFiles";
import { stringifyTile } from "../../tiles";
import { convertCnToId } from "./helpersForCn";
import { getTileDataFileName, getTilesDirPath } from "./helpersForPaths";
import {
  CenterInCombinedTileFeaturesData,
  ExtentInCombinedTileFeaturesData,
  FeatureInCombinedTileExtentsData,
  FeatureType,
  TileData,
} from "./types";

export const combineTiles = async ({
  featureType,
  logger,
}: {
  featureType: FeatureType;
  logger: Console;
}): Promise<{
  featureCenters: CenterInCombinedTileFeaturesData[];
  featureExtents: ExtentInCombinedTileFeaturesData[];
  tileExtents: FeatureInCombinedTileExtentsData[];
}> => {
  const featureExtentsWithDuplicates: ExtentInCombinedTileFeaturesData[] = [];
  const featureCentersWithDuplicates: CenterInCombinedTileFeaturesData[] = [];
  const tileExtents: FeatureInCombinedTileExtentsData[] = [];

  await processFiles({
    logger,
    fileSearchPattern: `**/${getTileDataFileName()}`,
    fileSearchDirPath: getTilesDirPath(featureType),
    processFile: async (filePath) => {
      const tileData = (await fs.readJson(filePath)) as TileData;

      const tileId = stringifyTile(tileData.tile);

      tileExtents.push(
        turf.feature(tileData.fetchedExtent, {
          tileId,
          fetchedAt: tileData.fetchedAt,
          fetchedFeatureCount: tileData.response.features.length,
        }),
      );

      tileData.response.features.forEach((responseFeature) => {
        const { cn, id } = responseFeature.attrs;
        const derivedId = convertCnToId(cn);
        if (derivedId !== id) {
          logger.log(
            chalk.red(
              `Id mismatch detected for object with cn ${responseFeature.attrs.cn}: Derived id is ${derivedId}, while real id is ${id}. Downstream scripts may fail.`,
            ),
          );
        }

        const center: CenterInCombinedTileFeaturesData = turf.toWgs84(
          turf.point(
            [responseFeature.center.x, responseFeature.center.y],
            sortKeys({
              tileId,
              ...responseFeature.attrs,
            }),
          ),
        );

        const plainExtent = turf.toWgs84(
          turf.bboxPolygon([
            responseFeature.extent.xmin,
            responseFeature.extent.ymin,
            responseFeature.extent.xmax,
            responseFeature.extent.ymax,
          ]),
        );
        const extent: ExtentInCombinedTileFeaturesData = turf.feature(
          plainExtent.geometry!,
          { cn },
        );

        // Creating two separate features because QGIS cannot render GeometryCollection
        // https://github.com/qgis/QGIS/issues/32747#issuecomment-770267561
        featureCentersWithDuplicates.push(center);
        featureExtentsWithDuplicates.push(extent);
      });
    },
  });

  process.stdout.write(chalk.green("Deduplicating features..."));

  const featureCenters = _.uniqBy(
    featureCentersWithDuplicates,
    (feature) => feature.properties?.cn,
  );

  const featureExtents = _.uniqBy(
    featureExtentsWithDuplicates,
    (feature) => feature.properties?.cn,
  );

  process.stdout.write(
    ` Count reduced from ${featureExtentsWithDuplicates.length} to ${featureExtents.length}.\n`,
  );

  return {
    featureCenters,
    featureExtents,
    tileExtents,
  };
  // logger.log(chalk.green("Saving..."));

  // await writeFormattedJson(
  //   getCombinedTileFeaturesFilePath(featureType),
  //   turf.featureCollection(features),
  // );
  // logger.log(
  //   `Features saved to ${chalk.magenta(
  //     getCombinedTileFeaturesFilePath(featureType),
  //   )}`,
  // );

  // await writeFormattedJson(
  //   getCombinedTileExtentsFilePath(featureType),
  //   turf.featureCollection(tileExtents),
  // );
  // logger.log(
  //   `Tile extents saved to ${chalk.magenta(
  //     getCombinedTileExtentsFilePath(featureType),
  //   )}`,
  // );
};
