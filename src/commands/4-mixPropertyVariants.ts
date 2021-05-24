import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import sortKeys from "sort-keys";

import { deepClean } from "../shared/deepClean";
import { writeFormattedJson } from "../shared/helpersForJson";
import {
  aggregatePropertyVariantLookups,
  generateFilterPropertyVariantLookup,
  getMixedOutputLayersFilePath,
  getMixedPropertyVariantsFilePath,
  MixedOutputLayersFeatureCollection,
  MixedPropertyVariantsFeature,
  MixedPropertyVariantsFeatureProperties,
} from "../shared/outputMixing";

export const mixPropertyVariants: Command = async ({ logger }) => {
  logger.log(chalk.bold("Mixing property variants"));

  process.stdout.write(chalk.green("Loading mixed output layers..."));
  const inputFileName = getMixedOutputLayersFilePath();
  const inputFeatureCollection = (await fs.readJson(
    inputFileName,
  )) as MixedOutputLayersFeatureCollection;

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green("Mixing property variants..."));

  const outputFeatures: MixedPropertyVariantsFeature[] = [];
  for (const inputFeature of inputFeatureCollection.features) {
    const propertyVariantLookups = inputFeature.properties.variants;

    const geometrySource = inputFeature.properties.geometrySource;
    const propertyVariantThatCameWithGeometry = propertyVariantLookups.find(
      (propertyVariant) => propertyVariant.source === geometrySource,
    );

    if (!propertyVariantThatCameWithGeometry) {
      throw new Error(
        "Did not expect propertyVariantThatCameWithGeometry to be undefined. This is a big, please report it.",
      );
    }

    const filterPropertyVariantLookup = generateFilterPropertyVariantLookup(
      propertyVariantLookups,
      logger,
    );

    const geometryNeedsToBeIgnored = !filterPropertyVariantLookup(
      propertyVariantThatCameWithGeometry,
    );

    if (geometryNeedsToBeIgnored) {
      continue;
    }

    const outputFeatureProperties: MixedPropertyVariantsFeatureProperties = deepClean(
      {
        geometrySource: inputFeature.properties.geometrySource,
        ...aggregatePropertyVariantLookups(
          propertyVariantLookups,
          filterPropertyVariantLookup,
        ),
      },
    );
    outputFeatures.push(
      turf.feature(inputFeature.geometry, sortKeys(outputFeatureProperties)),
    );
  }

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green(`Saving...`));

  const resultFileName = getMixedPropertyVariantsFilePath();
  const outputFeatureCollection = turf.featureCollection(outputFeatures);
  await writeFormattedJson(resultFileName, outputFeatureCollection);

  logger.log(` Result saved to ${chalk.magenta(resultFileName)}`);
};

autoStartCommandIfNeeded(mixPropertyVariants, __filename);
