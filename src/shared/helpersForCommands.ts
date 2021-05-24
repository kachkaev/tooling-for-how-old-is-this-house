import { Command } from "@kachkaev/commands";
import chalk from "chalk";
import path from "path";
import sortKeys from "sort-keys";

import { deriveCompletionYearFromCompletionDates } from "./completionDates";
import { geocodeAddress, loadCombinedGeocodeDictionary } from "./geocoding";
import { writeFormattedJson } from "./helpersForJson";
import { getSourceDirPath } from "./helpersForPaths";
import {
  ConfiguredGeocodeAddress,
  GenerateOutputLayer,
  getOutputLayerFileName,
  OutputLayer,
  reportGeocodesInOutputLayer,
} from "./outputLayers";
import { getAddressNormalizationConfig } from "./territory";

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
    logger.log(chalk.bold(`sources/${source}: Reporting geocodes`));

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
    logger.log(chalk.bold(`sources/${source}: Extracting output layer`));

    let configuredGeocodeAddress:
      | ConfiguredGeocodeAddress
      | undefined = undefined;

    if (canUseCollectedGeocodes) {
      const addressNormalizationConfig = await getAddressNormalizationConfig();
      const combinedGeocodeDictionary = await loadCombinedGeocodeDictionary();

      configuredGeocodeAddress = (address) =>
        geocodeAddress(
          address,
          addressNormalizationConfig,
          combinedGeocodeDictionary,
          // TODO: Pick from territory config / global config
          ["osm", "yandex"],
        );
    }

    const outputLayer = await generateOutputLayer({
      logger,
      geocodeAddress: configuredGeocodeAddress,
    });

    process.stdout.write(chalk.green(`Adding derived properties...`));

    const outputLayerWithDerivedProperties: OutputLayer = {
      ...outputLayer,
      features: outputLayer.features.map((feature) => ({
        ...feature,
        properties: sortKeys({
          ...feature.properties,
          derivedCompletionYear: deriveCompletionYearFromCompletionDates(
            feature.properties.completionDates,
          ),
        }),
      })),
    };

    logger.log(` Done.`);

    process.stdout.write(chalk.green(`Saving...`));

    const outputLayerFilePath = path.resolve(
      getSourceDirPath(source),
      getOutputLayerFileName(),
    );

    await writeFormattedJson(
      outputLayerFilePath,
      outputLayerWithDerivedProperties,
    );

    logger.log(` Result saved to ${chalk.magenta(outputLayerFilePath)}`);
  };
};

export const eraseLastLineInOutput = (logger: Console) => {
  if (logger) {
    process.stdout.moveCursor?.(0, -1);
    process.stdout.clearScreenDown?.();
  }
};
