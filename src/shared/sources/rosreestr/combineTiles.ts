import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";

import { writeFormattedJson } from "../../helpersForJson";
import { processFiles } from "../../processFiles";
import { stringifyTile } from "../../tiles";
import { convertCnToId } from "./helpersForCn";
import {
  getCombinedTileExtentsFilePath,
  getCombinedTileFeaturesFilePath,
  getTileDataFileName,
  getTilesDirPath,
} from "./helpersForPaths";
import {
  CenterInCombinedTileFeaturesData,
  ExtentInCombinedTileFeaturesData,
  FeatureInCombinedTileExtentsData,
  FeatureType,
  TileData,
} from "./types";

export * from "./generateProcessTile";
export * from "./helpersForPaths";
export * from "./types";

export const combineTiles = async ({
  featureType,
  logger,
}: {
  featureType: FeatureType;
  logger: Console;
}) => {
  const featuresWithDuplicates: Array<
    CenterInCombinedTileFeaturesData | ExtentInCombinedTileFeaturesData
  > = [];
  const tiles: FeatureInCombinedTileExtentsData[] = [];

  await processFiles({
    logger,
    fileSearchPattern: `**/${getTileDataFileName()}`,
    fileSearchDirPath: getTilesDirPath(featureType),
    processFile: async (filePath) => {
      const tileData = (await fs.readJson(filePath)) as TileData;

      const tileId = stringifyTile(tileData.tile);

      tiles.push(
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
          turf.point([responseFeature.center.x, responseFeature.center.y], {
            tileId,
            ...responseFeature.attrs,
          }),
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
        featuresWithDuplicates.push(center, extent);
      });
    },
  });

  process.stdout.write(chalk.green("Deduplicating features..."));

  const features = _.uniqBy(
    featuresWithDuplicates,
    (feature) => `${feature.geometry?.type}=${feature.properties?.cn}`,
  );

  process.stdout.write(
    ` Count reduced from ${featuresWithDuplicates.length} to ${features.length}.\n`,
  );

  logger.log(chalk.green("Saving..."));

  await writeFormattedJson(
    getCombinedTileFeaturesFilePath(featureType),
    turf.featureCollection(features),
  );
  logger.log(
    `Features saved to ${chalk.magenta(
      getCombinedTileFeaturesFilePath(featureType),
    )}`,
  );

  await writeFormattedJson(
    getCombinedTileExtentsFilePath(featureType),
    turf.featureCollection(tiles),
  );
  logger.log(
    `Tile extents saved to ${chalk.magenta(
      getCombinedTileExtentsFilePath(featureType),
    )}`,
  );
};
