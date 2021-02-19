import { Command } from "@kachkaev/commands";
import chalk from "chalk";
import path from "path";

import { getSourceDirPath } from "./getSourceDirPath";
import { writeFormattedJson } from "./helpersForJson";
import {
  GenerateOutputLayer,
  getOutputLayerFileName,
  reportGeocodesInOutputLayer,
} from "./output";

export const generateProgress = (index: number, total: number) => {
  const totalLength = `${total}`.length;

  return `${`${index + 1}`.padStart(totalLength)} / ${total}`;
};

export const generateReportGeocodes = ({
  source,
  generateOutputLayer,
}: {
  source: string;
  generateOutputLayer: GenerateOutputLayer;
}): Command => {
  return async ({ logger }) => {
    logger.log(chalk.bold(`sources/${source}: report geocodes`));

    const outputLayer = await generateOutputLayer({ logger });

    await reportGeocodesInOutputLayer({
      source,
      outputLayer,
      logger,
    });
  };
};

export const generateExtractOutputLayer = ({
  source,
  generateOutputLayer,
}: {
  source: string;
  generateOutputLayer: GenerateOutputLayer;
}): Command => {
  return async ({ logger }) => {
    logger.log(chalk.bold(`sources/${source}: extract output layer`));

    const outputLayer = await generateOutputLayer({ logger });

    const outputLayerFilePath = path.resolve(
      getSourceDirPath(source),
      getOutputLayerFileName(),
    );
    await writeFormattedJson(outputLayerFilePath, outputLayer);
  };
};
