/* eslint-disable @typescript-eslint/naming-convention */
import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import sortKeys from "sort-keys";

import { deepClean } from "../shared/deepClean";
import { writeFormattedJson } from "../shared/helpersForJson";
import {
  getMixedPropertyVariantsFileName,
  getUploadFileName,
  MixedPropertyVariantsFeatureCollection,
  UploadFeature,
  UploadFeatureProperties,
} from "../shared/output";

export const prepareUpload: Command = async ({ logger }) => {
  logger.log(chalk.bold("Prepare upload file"));

  process.stdout.write(chalk.green("Loading mixed property variants..."));
  const inputFileName = getMixedPropertyVariantsFileName();
  const inputFeatureCollection = (await fs.readJson(
    inputFileName,
  )) as MixedPropertyVariantsFeatureCollection;

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green("Processing..."));

  const outputFeatures: UploadFeature[] = [];
  for (const inputFeature of inputFeatureCollection.features) {
    const outputFeatureProperties: UploadFeatureProperties = {
      fid: outputFeatures.length + 1,
      r_adress: inputFeature.properties.address,
      r_year_int: inputFeature.properties.derivedCompletionYear,
      r_years_st: inputFeature.properties.completionDates,
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

  const resultFileName = getUploadFileName();
  const outputFeatureCollection = turf.featureCollection(outputFeatures);
  await writeFormattedJson(resultFileName, outputFeatureCollection);

  logger.log(` Result saved to ${chalk.magenta(resultFileName)}`);
};

autoStartCommandIfNeeded(prepareUpload, __filename);
