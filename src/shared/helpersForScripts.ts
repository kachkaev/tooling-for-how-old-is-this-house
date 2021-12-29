import chalk from "chalk";
import _ from "lodash";
import path from "path";
import sortKeys from "sort-keys";
import { WriteStream } from "tty";

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
    output?.write(chalk.bold(`sources/${source}: Extracting output layer\n`));

    let configuredGeocodeAddress: ConfiguredGeocodeAddress | undefined =
      undefined;

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
        let derivedCompletionYear: number | undefined = undefined;

        try {
          derivedCompletionYear = parseCompletionTime(
            feature.properties.completionTime ?? undefined,
          ).derivedCompletionYear;
        } catch (error) {
          output?.write(
            `${chalk.yellow(
              error instanceof Error ? error.message : `${error}`,
            )}\n`,
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
  output.moveCursor?.(0, -1);
  output.clearScreenDown?.();
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

/**
 * TODO: Remove after 2022-04-01
 */
export const autoStartScriptAndWarnAboutFileRenaming = async (
  filePath: string,
) => {
  const dirPath = path.dirname(filePath);
  const fileName = path.basename(filePath, ".ts");
  const newFileName = _.kebabCase(fileName);
  const newFilePath = path.resolve(
    dirPath.replace(/\\/g, "/").replace("src/commands", "src/scripts"),
    `${newFileName}.ts`,
  );

  /* eslint-disable no-console */
  console.log();
  console.log("========");
  console.log(`Script paths have changed. Please replace`);
  console.log(`  ${path.relative(process.cwd(), filePath)}`);
  console.log("with");
  console.log(`  ${path.relative(process.cwd(), newFilePath)}`);
  console.log("to hide this warning. Old paths will stop working in the");
  console.log("future, so should be removed from all software and docs.");
  console.log("========");
  console.log();
  /* eslint-enable no-console */

  (await import(newFilePath)).default({ logger: console });
};
