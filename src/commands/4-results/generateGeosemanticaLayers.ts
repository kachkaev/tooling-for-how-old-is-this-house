import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import sortKeys from "sort-keys";

import { deepClean } from "../../shared/deepClean";
import { writeFormattedJson } from "../../shared/helpersForJson";
import {
  getMixedPropertyVariantsFilePath,
  MixedPropertyVariants,
  MixedPropertyVariantsFeatureCollection,
} from "../../shared/mixing";
import { OutputGeometry } from "../../shared/outputLayers";
import {
  ensureTerritoryGitignoreContainsResults,
  generateVersionSuffix,
  getResultsDirPath,
} from "../../shared/results";
import {
  getTerritoryAddressHandlingConfig,
  getTerritoryId,
} from "../../shared/territory";

interface MainLayerProperties {
  fid: number;

  /* eslint-disable @typescript-eslint/naming-convention */
  /** Using ‘adress’ instead of ‘address’ for consistency with first uploaded cities */
  r_adress?: null | string;
  r_architect?: null | string;
  r_copyrights?: null | string;
  r_floors?: null | number;
  r_mkrf?: null | string;
  r_name?: null | string;
  r_photo_url?: null | string;
  r_style?: null | string;
  r_url?: null | string;
  r_wikidata?: null | string;
  r_wikipedia?: null | string;
  r_year_int?: null | number;
  r_years_str?: null | string;
  /* eslint-enable @typescript-eslint/naming-convention */
}

interface SupplementaryLayerProperties {
  fid: number;
}

// Placeholder properties are added to the first feature of the resulting feature collection.
// This ensures property list completeness and order in apps like QGIS.
const placeholderProperties: Record<keyof MainLayerProperties, null> = {
  fid: null,

  /* eslint-disable @typescript-eslint/naming-convention */
  r_adress: null,
  r_architect: null,
  r_copyrights: null,
  r_floors: null,
  r_mkrf: null,
  r_name: null,
  r_photo_url: null,
  r_style: null,
  r_url: null,
  r_wikidata: null,
  r_wikipedia: null,
  r_year_int: null,
  r_years_str: null,
  /* eslint-enable @typescript-eslint/naming-convention */
};

const generateCopyrights = ({
  photoUrl,
  photoSource,
  photoAuthorName,
  photoAuthorUrl,
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

  return `фото: ${[photoAuthorName, photoAuthorUrl]
    .filter((v) => Boolean(v))
    .join(", ")}`;
};

type MainLayerFeature = turf.Feature<OutputGeometry, MainLayerProperties>;

type SupplementaryLayerFeature = turf.Feature<
  OutputGeometry,
  SupplementaryLayerProperties
>;

export const generateGeosemanticaLayers: Command = async ({ logger }) => {
  logger.log(chalk.bold("results: Generate Geosemantica layers"));

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

  const mainFeatures: MainLayerFeature[] = [];
  const supplementaryFeatures: SupplementaryLayerFeature[] = [];

  for (const inputFeature of inputFeatureCollection.features) {
    const index = mainFeatures.length;
    const fid = index + 1;
    const outputFeatureProperties: MainLayerProperties = deepClean({
      fid,

      /* eslint-disable @typescript-eslint/naming-convention */
      r_adress: removeDefaultRegionFromAddress(
        inputFeature.properties.derivedBeautifiedAddress ??
          inputFeature.properties.address ??
          undefined,
      ),
      r_architect: inputFeature.properties.architect,
      r_copyrights: generateCopyrights(inputFeature.properties),
      r_floors: inputFeature.properties.floorCountAboveGround,
      r_mkrf: inputFeature.properties.mkrfUrl,
      r_name: inputFeature.properties.derivedBeautifiedName,
      r_photo_url: inputFeature.properties.photoUrl,
      r_style: inputFeature.properties.style,
      r_url: inputFeature.properties.url,
      r_wikidata: inputFeature.properties.wikidataUrl,
      r_wikipedia: inputFeature.properties.wikipediaUrl,
      r_year_int: inputFeature.properties.derivedCompletionYear,
      r_years_str:
        inputFeature.properties.derivedCompletionDatesForGeosemantica,
      /* eslint-enable @typescript-eslint/naming-convention */
    });

    mainFeatures.push(
      turf.feature(
        inputFeature.geometry,
        sortKeys(
          index === 0
            ? { ...placeholderProperties, ...outputFeatureProperties }
            : outputFeatureProperties,
        ),
      ),
    );
    supplementaryFeatures.push(turf.feature(inputFeature.geometry, { fid }));
  }

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green(`Saving...`));

  await ensureTerritoryGitignoreContainsResults();

  const version = generateVersionSuffix();
  const territoryId = getTerritoryId();
  const mainLayerFilePath = path.resolve(
    getResultsDirPath(),
    `geosemantica-layer.${territoryId}.${version}.main.geojson`,
  );
  const supplementaryLayerFilePath = path.resolve(
    getResultsDirPath(),
    `geosemantica-layer.${territoryId}.${version}.supplementary.geojson`,
  );

  await writeFormattedJson(
    mainLayerFilePath,
    turf.featureCollection(mainFeatures),
  );

  await writeFormattedJson(
    supplementaryLayerFilePath,
    turf.featureCollection(supplementaryFeatures),
  );

  logger.log(
    ` Result saved to:\n${chalk.magenta(mainLayerFilePath)}\n${chalk.magenta(
      supplementaryLayerFilePath,
    )}`,
  );
};

autoStartCommandIfNeeded(generateGeosemanticaLayers, __filename);