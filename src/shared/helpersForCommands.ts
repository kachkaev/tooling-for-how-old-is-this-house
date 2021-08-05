import { Command } from "@kachkaev/commands";
import chalk from "chalk";
import path from "path";
import sortKeys from "sort-keys";

import { deepClean } from "./deepClean";
import { geocodeAddress, loadCombinedGeocodeDictionary } from "./geocoding";
import { writeFormattedJson } from "./helpersForJson";
import { getSourceDirPath } from "./helpersForPaths";
import {
  ConfiguredGeocodeAddress,
  GenerateOutputLayer,
  getOutputLayerFileName,
  OutputLayer,
  OutputLayerProperties,
  reportGeocodesInOutputLayer,
} from "./outputLayers";
import { parseCompletionTime } from "./parseCompletionTime";
import {
  ensureTerritoryGitignoreContainsLine,
  getTerritoryAddressHandlingConfig,
} from "./territory";

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

// Placeholder properties are added to the first feature of the resulting feature collection.
// This ensures property list completeness and order in apps like QGIS.
const placeholderProperties: Record<keyof OutputLayerProperties, null> = {
  address: null,
  architect: null,
  buildingType: null,
  completionTime: null,
  dataToOmit: null,
  derivedCompletionYear: null,
  documentedBuildArea: null,
  externalGeometrySource: null,
  floorCountAboveGround: null,
  floorCountBelowGround: null,
  id: null,
  knownAt: null,
  mkrfUrl: null,
  name: null,
  photoAuthorName: null,
  photoAuthorUrl: null,
  photoUrl: null,
  style: null,
  url: null,
  wikidataUrl: null,
  wikipediaUrl: null,
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
      const addressHandlingConfig = await getTerritoryAddressHandlingConfig(
        logger,
      );
      const combinedGeocodeDictionary = await loadCombinedGeocodeDictionary(
        logger,
      );

      configuredGeocodeAddress = (address) =>
        geocodeAddress(
          address,
          addressHandlingConfig,
          combinedGeocodeDictionary,
          // TODO: Pick from territory config / global config
          ["osm", "yandex", "mkrf", "wikivoyage", "mingkh"],
        );
    }

    const outputLayer = await generateOutputLayer({
      logger,
      geocodeAddress: configuredGeocodeAddress,
    });

    process.stdout.write(chalk.green(`Adding derived properties...`));

    const outputLayerWithDerivedProperties: OutputLayer = {
      ...outputLayer,
      features: outputLayer.features.map((feature, index) => {
        const propertiesWithDerivatives = deepClean({
          ...feature.properties,
          derivedCompletionYear: parseCompletionTime(
            feature.properties.completionTime ?? undefined,
          ).derivedCompletionYear,
        });

        return {
          ...feature,
          properties: sortKeys(
            index === 0
              ? { ...placeholderProperties, ...propertiesWithDerivatives }
              : propertiesWithDerivatives,
          ),
        };
      }),
    };

    logger.log(` Done.`);

    process.stdout.write(chalk.green(`Saving...`));

    const outputLayerFilePath = path.resolve(
      getSourceDirPath(source),
      getOutputLayerFileName(),
    );

    await ensureTerritoryGitignoreContainsLine(getOutputLayerFileName());

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
