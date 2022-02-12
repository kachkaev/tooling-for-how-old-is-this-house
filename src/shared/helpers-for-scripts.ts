import chalk from "chalk";
import path from "node:path";
import { WriteStream } from "node:tty";
import sortKeys from "sort-keys";

import { deepClean } from "./deep-clean";
import { geocodeAddress, loadCombinedGeocodeDictionary } from "./geocoding";
import { writeFormattedJson } from "./helpers-for-json";
import { getSourceDirPath } from "./helpers-for-paths";
import {
  ConfiguredGeocodeAddress,
  GenerateOutputLayer,
  getOutputLayerFileName,
  OutputLayer,
  OutputLayerProperties,
  reportGeocodesInOutputLayer,
} from "./output-layers";
import { parseCompletionTime } from "./parse-completion-time";
import {
  ensureTerritoryGitignoreContainsLine,
  getTerritoryAddressHandlingConfig,
} from "./territory";

export const generateProgress = (index: number, total: number) => {
  const totalLength = `${total}`.length;

  return `${`${index + 1}`.padStart(totalLength)} / ${total}`;
};

export const generateReportGeocodes =
  ({
    generateOutputLayer,
    output,
    source,
  }: {
    generateOutputLayer: GenerateOutputLayer;
    output: WriteStream;
    source: string;
  }) =>
  async () => {
    output.write(chalk.bold(`sources/${source}: Reporting geocodes\n`));

    const outputLayer = await generateOutputLayer({ output });

    await reportGeocodesInOutputLayer({
      source,
      outputLayer,
      output,
    });
  };

// Placeholder properties are added to the first feature of the resulting feature collection.
// This ensures property list completeness and order in apps like QGIS.
const placeholderProperties: Record<keyof OutputLayerProperties, null> = {
  /* eslint-disable unicorn/no-null */
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
  /* eslint-enable unicorn/no-null */
};

export const generateExtractOutputLayer =
  ({
    source,
    output,
    generateOutputLayer,
    canUseCollectedGeocodes,
  }: {
    source: string;
    output: WriteStream;
    generateOutputLayer: GenerateOutputLayer;
    canUseCollectedGeocodes?: boolean;
  }) =>
  async () => {
    output.write(chalk.bold(`sources/${source}: Extracting output layer\n`));

    let configuredGeocodeAddress: ConfiguredGeocodeAddress | undefined;

    if (canUseCollectedGeocodes) {
      const addressHandlingConfig = await getTerritoryAddressHandlingConfig(
        output,
      );
      const combinedGeocodeDictionary = await loadCombinedGeocodeDictionary(
        output,
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
      geocodeAddress: configuredGeocodeAddress,
      output,
    });

    output.write(chalk.green(`Adding derived properties...`));

    const outputLayerWithDerivedProperties: OutputLayer = {
      ...outputLayer,
      features: outputLayer.features.map((feature, index) => {
        let derivedCompletionYear: number | undefined;

        try {
          derivedCompletionYear = parseCompletionTime(
            feature.properties.completionTime ?? undefined,
          ).derivedCompletionYear;
        } catch (error) {
          output.write(
            `${chalk.yellow(error instanceof Error ? error.message : error)}\n`,
          );
        }

        const propertiesWithDerivatives = deepClean({
          ...feature.properties,
          derivedCompletionYear,
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

    output.write(" Done.\n");

    output.write(chalk.green("Saving..."));

    const outputLayerFilePath = path.resolve(
      getSourceDirPath(source),
      getOutputLayerFileName(),
    );

    await ensureTerritoryGitignoreContainsLine(getOutputLayerFileName());

    await writeFormattedJson(
      outputLayerFilePath,
      outputLayerWithDerivedProperties,
    );

    output.write(` Result saved to ${chalk.magenta(outputLayerFilePath)}\n`);
  };

export const eraseLastLineInOutput = (output: WriteStream) => {
  output.moveCursor(0, -1);
  output.clearScreenDown();
};

export const ensureTerritoryGitignoreContainsPreview =
  async (): Promise<void> => {
    await ensureTerritoryGitignoreContainsLine("preview--*.*");
  };

export class ScriptError extends Error {}

process.on("uncaughtException", (error) => {
  if (error instanceof ScriptError) {
    // eslint-disable-next-line no-console
    console.log(chalk.red(error.message));
  } else {
    // eslint-disable-next-line no-console
    console.log(error);
  }
  process.exit(1);
});
