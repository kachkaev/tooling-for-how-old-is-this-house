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

interface UploadFeatureProperties {
  /* eslint-disable @typescript-eslint/naming-convention */
  fid: number;
  r_adress?: string;
  r_architec?: string;
  r_copyrigh?: string;
  r_name?: string;
  r_photo_ur?: string;
  r_style?: string;
  r_url?: string;
  r_wikipedi?: string;
  r_year_int?: number;
  r_years_st?: string;
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

  const outputFeatures: UploadFeature[] = [];
  for (const inputFeature of inputFeatureCollection.features) {
    const outputFeatureProperties: UploadFeatureProperties = {
      /* eslint-disable @typescript-eslint/naming-convention */
      fid: outputFeatures.length + 1,
      r_adress: inputFeature.properties.address,
      r_year_int: inputFeature.properties.derivedCompletionYear,
      r_years_st: inputFeature.properties.completionDates,
      r_name: inputFeature.properties.name,
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
