import { Command, CommandError } from "@kachkaev/commands";
import axios from "axios";
import chalk from "chalk";
import getPort from "get-port";
import { createServer } from "http";
import _ from "lodash";
import next from "next";
import path from "path";
import sortKeys from "sort-keys";
import { parse } from "url";

import { deepClean } from "./deepClean";
import { geocodeAddress, loadCombinedGeocodeDictionary } from "./geocoding";
import { writeFormattedJson } from "./helpersForJson";
import { getSourceDirPath } from "./helpersForPaths";
import {
  ConfiguredGeocodeAddress,
  GenerateOutputLayer,
  getOutputLayerFileName,
  OutputLayer,
  OutputLayerProperties,
  reportGeocodesInOutputLayer,
} from "./outputLayers";
import { parseCompletionDates } from "./parseCompletionDates";
import {
  ensureTerritoryGitignoreContainsLine,
  getTerritoryAddressHandlingConfig,
  getTerritoryConfig,
  TerritoryConfig,
} from "./territory";

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
    logger.log(chalk.bold(`sources/${source}: Reporting geocodes`));

    const outputLayer = await generateOutputLayer({ logger });

    await reportGeocodesInOutputLayer({
      source,
      outputLayer,
      logger,
    });
  };
};

// Placeholder properties are added to the first feature of the resulting feature collection.
// This ensures property list completeness and order in apps like QGIS.
const placeholderProperties: Record<keyof OutputLayerProperties, null> = {
  address: null,
  architect: null,
  buildingType: null,
  completionDates: null,
  dataToOmit: null,
  derivedCompletionYear: null,
  documentedBuildArea: null,
  externalGeometrySource: null,
  floorCountAboveGround: null,
  floorCountBelowGround: null,
  id: null,
  knownAt: null,
  mkrfUrl: null,
  name: null,
  photoAuthorName: null,
  photoAuthorUrl: null,
  photoUrl: null,
  style: null,
  url: null,
  wikidataUrl: null,
  wikipediaUrl: null,
};

export const generateExtractOutputLayer = ({
  source,
  generateOutputLayer,
  canUseCollectedGeocodes,
}: {
  source: string;
  generateOutputLayer: GenerateOutputLayer;
  canUseCollectedGeocodes?: boolean;
}): Command => {
  return async ({ logger }) => {
    logger.log(chalk.bold(`sources/${source}: Extracting output layer`));

    let configuredGeocodeAddress:
      | ConfiguredGeocodeAddress
      | undefined = undefined;

    if (canUseCollectedGeocodes) {
      const addressHandlingConfig = await getTerritoryAddressHandlingConfig(
        logger,
      );
      const combinedGeocodeDictionary = await loadCombinedGeocodeDictionary(
        logger,
      );

      configuredGeocodeAddress = (address) =>
        geocodeAddress(
          address,
          addressHandlingConfig,
          combinedGeocodeDictionary,
          // TODO: Pick from territory config / global config
          ["osm", "yandex", "mkrf", "wikivoyage", "mingkh"],
        );
    }

    const outputLayer = await generateOutputLayer({
      logger,
      geocodeAddress: configuredGeocodeAddress,
    });

    process.stdout.write(chalk.green(`Adding derived properties...`));

    const outputLayerWithDerivedProperties: OutputLayer = {
      ...outputLayer,
      features: outputLayer.features.map((feature, index) => {
        const propertiesWithDerivatives = deepClean({
          ...feature.properties,
          derivedCompletionYear: parseCompletionDates(
            feature.properties.completionDates ?? undefined,
          ).derivedCompletionYear,
        });

        return {
          ...feature,
          properties: sortKeys(
            index === 0
              ? { ...placeholderProperties, ...propertiesWithDerivatives }
              : propertiesWithDerivatives,
          ),
        };
      }),
    };

    logger.log(` Done.`);

    process.stdout.write(chalk.green(`Saving...`));

    const outputLayerFilePath = path.resolve(
      getSourceDirPath(source),
      getOutputLayerFileName(),
    );

    await ensureTerritoryGitignoreContainsLine(getOutputLayerFileName());

    await writeFormattedJson(
      outputLayerFilePath,
      outputLayerWithDerivedProperties,
    );

    logger.log(` Result saved to ${chalk.magenta(outputLayerFilePath)}`);
  };
};

export const eraseLastLineInOutput = (logger: Console) => {
  if (logger) {
    process.stdout.moveCursor?.(0, -1);
    process.stdout.clearScreenDown?.();
  }
};

const defaultPort = 3000;

const generateAppUrl = (port: number) => `http://localhost:${port}`;

const checkIfWebAppIsLaunched = async (
  webAppUrl: string,
  territoryConfig: TerritoryConfig,
): Promise<boolean> => {
  try {
    const fetchedTerritoryConfig = (
      await axios.get(`${webAppUrl}/api/territory-config`, {
        responseType: "json",
      })
    ).data;

    return _.isEqual(fetchedTerritoryConfig, territoryConfig);
  } catch {
    return false;
  }
};

export const ensureLaunchedWebApp = async ({
  logger,
  action,
}: {
  logger: Console;
  action: (webAppUrl: string) => Promise<void>;
}) => {
  const existingWebAppUrl = generateAppUrl(defaultPort);
  const territoryConfig = await getTerritoryConfig();

  if (await checkIfWebAppIsLaunched(existingWebAppUrl, territoryConfig)) {
    await action(existingWebAppUrl);

    return;
  }

  const tempAppPort = await getPort();
  const tempWebAppUrl = generateAppUrl(tempAppPort);

  process.stdout.write(
    chalk.green(`Starting a temporary web app at ${tempWebAppUrl}...`),
  );

  const originalConsole = global.console;
  global.console = { ...originalConsole, log: () => {} };

  const app = next({ dev: true, quiet: true });
  await app.prepare();
  const handle = app.getRequestHandler();
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url ?? "", true));
  });
  server.listen(tempAppPort);

  logger.log(" Done.");

  process.stdout.write(
    chalk.blue(
      'The above step can be skipped if you run "yarn dev" in another terminal. This will speed up the command.\n',
    ),
  );

  if (!(await checkIfWebAppIsLaunched(tempWebAppUrl, territoryConfig))) {
    throw new CommandError(
      `Unable to validate the web app at ${tempWebAppUrl}. Please report a bug.`,
    );
  }

  try {
    await action(tempWebAppUrl);
  } finally {
    process.stdout.write(
      chalk.green(`Stopping the web app at ${tempWebAppUrl}...`),
    );
    server.close();
    app.close();
    global.console = originalConsole;
    logger.log(" Done.");
  }
};
