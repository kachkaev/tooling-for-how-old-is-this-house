import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import sortKeys from "sort-keys";

import { deriveCompletionYearFromCompletionDates } from "../shared/completionDates";
import { deepClean } from "../shared/deepClean";
import { writeFormattedJson } from "../shared/helpersForJson";
import {
  getMixedOutputLayersFileName,
  getMixedPropertyVariantsFileName,
  MixedOutputLayersFeatureCollection,
  MixedPropertyVariantsFeature,
  MixedPropertyVariantsFeatureProperties,
  PropertyLookupVariant,
  PropertyLookupVariantAggregate,
} from "../shared/output";

const aggregateVariants = (
  variants: PropertyLookupVariant[],
): PropertyLookupVariantAggregate => {
  const result: PropertyLookupVariantAggregate = {};

  // TODO: order by priority
  const orderedVariants = _.orderBy(variants, (variant) => variant.source);

  for (const variant of orderedVariants) {
    if (variant.completionDates) {
      const derivedCompletionYear = deriveCompletionYearFromCompletionDates(
        variant.completionDates,
      );
      if (derivedCompletionYear) {
        result.completionDates = variant.completionDates;
        result.completionDatesSource = variant.source;
        result.derivedCompletionYear = derivedCompletionYear;
        break;
      }
    }
  }

  for (const variant of orderedVariants) {
    if (variant.address) {
      result.address = variant.address;
      result.addressSource = variant.source;
      break;
    }
  }

  return result;
};

export const mixPropertyVariants: Command = async ({ logger }) => {
  logger.log(chalk.bold("Mixing property variants"));

  process.stdout.write(chalk.green("Loading mixed output layers..."));
  const inputFileName = getMixedOutputLayersFileName();
  const inputFeatureCollection = (await fs.readJson(
    inputFileName,
  )) as MixedOutputLayersFeatureCollection;

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green("Processing..."));

  const outputFeatures: MixedPropertyVariantsFeature[] = [];
  for (const inputFeature of inputFeatureCollection.features) {
    const outputFeatureProperties: MixedPropertyVariantsFeatureProperties = deepClean(
      {
        geometrySource: inputFeature.properties.geometrySource,
        ...aggregateVariants(inputFeature.properties.variants),
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
