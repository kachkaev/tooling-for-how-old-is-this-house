import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";
import fs from "fs-extra";

import {
  getMixedPropertyVariantsFilePath,
  MixedPropertyVariantsFeatureCollection,
} from "../../shared/mixing";

export const showStat: Command = async ({ logger }) => {
  logger.log(chalk.bold("Statistics"));
  process.stdout.write(chalk.green("Loading mixed property variants..."));
  const inputFileName = getMixedPropertyVariantsFilePath();
  const inputFeatureCollection = (await fs.readJson(
    inputFileName,
  )) as MixedPropertyVariantsFeatureCollection;
  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green("Calculate statistics...\n"));
  const houses = inputFeatureCollection.features.filter(
    (f) => f.properties.address,
  );
  logger.log(` house count: ${chalk.cyan(houses.length)}`);
  const withYear = houses.filter((h) => h.properties.derivedCompletionYear);
  logger.log(` with year: ${chalk.cyan(withYear.length)}`);
  const withoutYear = houses.filter((h) => !h.properties.derivedCompletionYear);
  logger.log(` without year: ${chalk.cyan(withoutYear.length)}`);
  withYear.sort(
    (a, b) =>
      a.properties.derivedCompletionYear! - b.properties.derivedCompletionYear!,
  );
  const old = withYear.slice(0, 10);
  logger.log(` most old:`);
  old.forEach((h, i) => {
    const year = `${h.properties.derivedCompletionYear} год`;
    logger.log(
      `\n ${(i + 1).toString().padStart(2, "0")}. ${chalk.cyan(year)}`,
    );
    if (h.properties.name) {
      logger.log(`     ${h.properties.name}`);
    }
    logger.log(`     ${h.properties.address}`);
  });
};

autoStartCommandIfNeeded(showStat, __filename);
