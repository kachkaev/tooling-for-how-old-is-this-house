import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import sortKeys from "sort-keys";

import { deepClean } from "../shared/deepClean";
import { writeFormattedJson } from "../shared/helpersForJson";
import { OutputGeometry } from "../shared/outputLayers";
import {
  getMixedPropertyVariantsFilePath,
  getUploadFilePath,
  MixedPropertyVariantsFeatureCollection,
} from "../shared/outputMixing";
import { getTerritoryAddressHandlingConfig } from "../shared/territory";

interface UploadFeatureProperties {
  fid: number;

  /* eslint-disable @typescript-eslint/naming-convention */
  /** Using ‘adress’ instead of ‘address’ for consistency with first uploaded cities */
  r_adress?: string;
  r_architect?: string;
  r_copyright?: string;
  r_floors?: number;
  r_name?: string;
  r_photo_url?: string;
  r_style?: string;
  r_url?: string;
  r_wikipedia?: string;
  r_year_int?: number;
  r_years_str?: string;
  /* eslint-enable @typescript-eslint/naming-convention */
}

type UploadFeature = turf.Feature<OutputGeometry, UploadFeatureProperties>;

export const prepareUpload: Command = async ({ logger }) => {
  logger.log(chalk.bold("Preparing upload file"));

  process.stdout.write(chalk.green("Loading mixed property variants..."));
  const inputFileName = getMixedPropertyVariantsFilePath();
  const inputFeatureCollection = (await fs.readJson(
    inputFileName,
  )) as MixedPropertyVariantsFeatureCollection;

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green("Processing..."));

  const addressHandlingConfig = await getTerritoryAddressHandlingConfig(logger);

  const addressPrefixToRemove = addressHandlingConfig.defaultRegion
    ? `${addressHandlingConfig.defaultRegion.toLowerCase()}, `
    : undefined;

  const removeDefaultRegionFromAddress = (
    address: string | undefined,
  ): string | undefined => {
    if (!address) {
      return undefined;
    }

    if (
      !addressPrefixToRemove ||
      !address.toLowerCase().startsWith(addressPrefixToRemove)
    ) {
      return address;
    }

    return address.substr(addressPrefixToRemove.length);
  };

  const outputFeatures: UploadFeature[] = [];
  for (const inputFeature of inputFeatureCollection.features) {
    const outputFeatureProperties: UploadFeatureProperties = {
      fid: outputFeatures.length + 1,

      /* eslint-disable @typescript-eslint/naming-convention */
      r_adress: removeDefaultRegionFromAddress(
        inputFeature.properties.derivedBeautifiedAddress ??
          inputFeature.properties.address,
      ),
      r_floors: inputFeature.properties.floorCountAboveGround,
      r_name: inputFeature.properties.derivedBeautifiedName,
      r_photo_url: inputFeature.properties.photoUrl,
      r_url: inputFeature.properties.url,
      r_wikipedia: inputFeature.properties.wikipediaUrl,
      r_year_int: inputFeature.properties.derivedCompletionYear,
      r_years_str:
        inputFeature.properties.derivedCompletionDatesForGeosemantica,
      /* eslint-enable @typescript-eslint/naming-convention */
    };
    outputFeatures.push(
      turf.feature(
        inputFeature.geometry,
        sortKeys(deepClean(outputFeatureProperties)),
      ),
    );
  }

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green(`Saving...`));

  const resultFilePath = getUploadFilePath();
  const outputFeatureCollection = turf.featureCollection(outputFeatures);
  await writeFormattedJson(resultFilePath, outputFeatureCollection);

  logger.log(` Result saved to ${chalk.magenta(resultFilePath)}`);
};

autoStartCommandIfNeeded(prepareUpload, __filename);
