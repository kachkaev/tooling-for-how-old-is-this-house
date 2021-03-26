import { Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import path from "path";

import { loadCombinedGeocodeDictionary, resolveCoordinates } from "./geocoding";
import { writeFormattedJson } from "./helpersForJson";
import { getSourceDirPath } from "./helpersForPaths";
import {
  FindPointForNormalizedAddress,
  GenerateOutputLayer,
  getOutputLayerFileName,
  reportGeocodesInOutputLayer,
} from "./output";

export const generateProgress = (index: number, total: number) => {
  const totalLength = `${total}`.length;

  return `${`${index + 1}`.padStart(totalLength)} / ${total}`;
};

export const generateReportGeocodes = ({
  source,
  generateOutputLayer,
}: {
  source: string;
  generateOutputLayer: GenerateOutputLayer;
}): Command => {
  return async ({ logger }) => {
    logger.log(chalk.bold(`sources/${source}: report geocodes`));

    const outputLayer = await generateOutputLayer({ logger });

    await reportGeocodesInOutputLayer({
      source,
      outputLayer,
      logger,
    });
  };
};

export const generateExtractOutputLayer = ({
  source,
  generateOutputLayer,
  canUseCollectedGeocodes,
}: {
  source: string;
  generateOutputLayer: GenerateOutputLayer;
  canUseCollectedGeocodes?: boolean;
}): Command => {
  return async ({ logger }) => {
    logger.log(chalk.bold(`sources/${source}: extract output layer`));

    let findPointForNormalizedAddress:
      | FindPointForNormalizedAddress
      | undefined = undefined;

    if (canUseCollectedGeocodes) {
      const combinedGeocodeDictionary = await loadCombinedGeocodeDictionary();

      findPointForNormalizedAddress = (normalizedAddress) => {
        const coordinates = resolveCoordinates(
          combinedGeocodeDictionary,
          normalizedAddress,
          ["osm"],
        );
        if (coordinates) {
          return turf.point(coordinates).geometry;
        }
      };
    }

    process.stdout.write(chalk.green(`Generating data...`));

    const outputLayer = await generateOutputLayer({
      logger,
      findPointForNormalizedAddress,
    });

    logger.log(` Done.`);

    process.stdout.write(chalk.green(`Saving...`));

    const outputLayerFilePath = path.resolve(
      getSourceDirPath(source),
      getOutputLayerFileName(),
    );

    await writeFormattedJson(outputLayerFilePath, outputLayer);

    logger.log(` Result saved to ${chalk.magenta(outputLayerFilePath)}`);
  };
};
