import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import sortKeys from "sort-keys";

import { deepClean } from "../shared/deepClean";
import { writeFormattedJson } from "../shared/helpersForJson";
import {
  aggregatePropertyVariantLookups,
  getMixedOutputLayersFileName,
  getMixedPropertyVariantsFileName,
  MixedOutputLayersFeatureCollection,
  MixedPropertyVariantsFeature,
  MixedPropertyVariantsFeatureProperties,
} from "../shared/outputMixing";

export const mixPropertyVariants: Command = async ({ logger }) => {
  logger.log(chalk.bold("Mixing property variants"));

  process.stdout.write(chalk.green("Loading mixed output layers..."));
  const inputFileName = getMixedOutputLayersFileName();
  const inputFeatureCollection = (await fs.readJson(
    inputFileName,
  )) as MixedOutputLayersFeatureCollection;

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green("Mixing property variants..."));

  const outputFeatures: MixedPropertyVariantsFeature[] = [];
  for (const inputFeature of inputFeatureCollection.features) {
    const outputFeatureProperties: MixedPropertyVariantsFeatureProperties = deepClean(
      {
        geometrySource: inputFeature.properties.geometrySource,
        ...aggregatePropertyVariantLookups(
          inputFeature.properties.variants,
          logger,
        ),
      },
    );
    outputFeatures.push(
      turf.feature(inputFeature.geometry, sortKeys(outputFeatureProperties)),
    );
  }

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green(`Saving...`));

  const resultFileName = getMixedPropertyVariantsFileName();
  const outputFeatureCollection = turf.featureCollection(outputFeatures);
  await writeFormattedJson(resultFileName, outputFeatureCollection);

  logger.log(` Result saved to ${chalk.magenta(resultFileName)}`);
};

autoStartCommandIfNeeded(mixPropertyVariants, __filename);
