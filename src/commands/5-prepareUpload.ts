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
  MixedPropertyVariants,
  MixedPropertyVariantsFeatureCollection,
} from "../shared/outputMixing";
import { getTerritoryAddressHandlingConfig } from "../shared/territory";

interface UploadFeatureProperties {
  fid: number;

  /* eslint-disable @typescript-eslint/naming-convention */
  /** Using ‘adress’ instead of ‘address’ for consistency with first uploaded cities */
  r_adress?: null | string;
  r_architect?: null | string;
  r_copyrights?: null | string;
  r_floors?: null | number;
  r_name?: null | string;
  r_photo_url?: null | string;
  r_style?: null | string;
  r_url?: null | string;
  r_wikipedia?: null | string;
  r_year_int?: null | number;
  r_years_str?: null | string;
  /* eslint-enable @typescript-eslint/naming-convention */
}

// Placeholder properties are added to the first feature of the resulting feature collection.
// This ensures property list completeness and order in apps like QGIS.
const placeholderProperties: Record<keyof UploadFeatureProperties, null> = {
  fid: null,

  /* eslint-disable @typescript-eslint/naming-convention */
  r_adress: null,
  r_architect: null,
  r_copyrights: null,
  r_floors: null,
  r_name: null,
  r_photo_url: null,
  r_style: null,
  r_url: null,
  r_wikipedia: null,
  r_year_int: null,
  r_years_str: null,
  /* eslint-enable @typescript-eslint/naming-convention */
};

const generateCopyrights = ({
  photoUrl,
  photoSource,
  photoAuthorName,
}: MixedPropertyVariants): string | undefined => {
  if (!photoSource || !photoUrl) {
    return undefined;
  }

  if (photoUrl?.startsWith("https://commons.wikimedia.org")) {
    return `фото: Викимедя Коммонс`;
  }

  switch (photoSource) {
    case "mkrf":
      return `фото: Министерство культуры РФ`;
    case "wikimapia":
      return photoAuthorName && photoAuthorName !== "Guest"
        ? `фото: Викимапия (участник ${photoAuthorName})`
        : `фото: Викимапия`;
  }

  return `фото: ${photoSource}`;
};

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
    const index = outputFeatures.length;
    const outputFeatureProperties: UploadFeatureProperties = deepClean({
      fid: index + 1,

      /* eslint-disable @typescript-eslint/naming-convention */
      r_adress: removeDefaultRegionFromAddress(
        inputFeature.properties.derivedBeautifiedAddress ??
          inputFeature.properties.address ??
          undefined,
      ),
      r_architect: inputFeature.properties.architect,
      r_copyrights: generateCopyrights(inputFeature.properties),
      r_floors: inputFeature.properties.floorCountAboveGround,
      r_name: inputFeature.properties.derivedBeautifiedName,
      r_photo_url: inputFeature.properties.photoUrl,
      r_style: inputFeature.properties.style,
      r_url: inputFeature.properties.url,
      r_wikipedia: inputFeature.properties.wikipediaUrl,
      r_year_int: inputFeature.properties.derivedCompletionYear,
      r_years_str:
        inputFeature.properties.derivedCompletionDatesForGeosemantica,
      /* eslint-enable @typescript-eslint/naming-convention */
    });

    outputFeatures.push(
      turf.feature(
        inputFeature.geometry,
        sortKeys(
          index === 0
            ? { ...placeholderProperties, ...outputFeatureProperties }
            : outputFeatureProperties,
        ),
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
