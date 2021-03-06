import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import readline from "readline";
import sortKeys from "sort-keys";

import {
  serializeTime,
  writeFormattedJson,
} from "../../../shared/helpersForJson";
import {
  getMkrfJsonsDumpFilePath,
  getMkrfObjectFilePath,
  MkrfObjectData,
  MkrfObjectFile,
} from "../../../shared/sources/mkrf";
import {
  getTerritoryConfig,
  getTerritoryExtent,
  TerritoryConfig,
} from "../../../shared/territory";

type PickReason = "position" | "address";

const derivePickReason = (
  objectData: MkrfObjectData,
  territoryConfig: TerritoryConfig,
  territoryExtent: turf.Feature<turf.Polygon | turf.MultiPolygon>,
): PickReason | undefined => {
  const position =
    objectData.data.general.additionalCoordinates?.[0] ??
    objectData.data.general.address?.mapPosition;

  if (position) {
    if (turf.booleanContains(territoryExtent, position)) {
      return "position";
    }
  }

  const fallbackAddressSelectors =
    territoryConfig?.sources?.mkrf
      ?.fallbackAddressSelectorsForObjectsWithoutGeometry;

  const fullAddress = objectData.data.general.address?.fullAddress;

  if (fullAddress && fallbackAddressSelectors instanceof Array) {
    for (const fallbackAddressSelector of fallbackAddressSelectors) {
      const selectors =
        typeof fallbackAddressSelector === "string"
          ? [fallbackAddressSelector]
          : fallbackAddressSelector;

      if (
        selectors.every((selectorPart) => fullAddress.includes(selectorPart))
      ) {
        return "address";
      }
    }
  }

  return undefined;
};

export const extractObjectsFromJsonsDump: Command = async ({ logger }) => {
  logger.log(
    chalk.bold("sources/mkrf: Extracting raw objects from JSONS dump"),
  );

  const territoryConfig = await getTerritoryConfig();
  const territoryExtent = await getTerritoryExtent();

  const jsonsDumpFilePath = getMkrfJsonsDumpFilePath();
  logger.log(`File location: ${chalk.cyan(jsonsDumpFilePath)}`);

  process.stdout.write(chalk.green(`Opening file...`));
  const fileStream = fs.createReadStream(jsonsDumpFilePath);
  const lineStream = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  logger.log(` Done.`);

  const dataDumpFileName = path.basename(jsonsDumpFilePath);
  const dataDumpProcessedAt = serializeTime();

  logger.log(
    chalk.green(
      "Scanning through objects and saving those within territory extent...",
    ),
  );

  let numberOfRecords = 0;
  const numberOfObjectsByPickReason: Record<PickReason, number> = {
    address: 0,
    position: 0,
  };

  for await (const line of lineStream) {
    let objectData: MkrfObjectData;

    // Skip final empty line
    if (line === "") {
      continue;
    }

    try {
      objectData = JSON.parse(line) as MkrfObjectData;
    } catch (e) {
      logger.log(
        chalk.red(
          `\n\nUnexpected JSON parse error occurred on row ${
            numberOfRecords + 1
          }. JSON content:\n\n${line}\n\nThis can happen if the file has been truncated when unpacking. Please try extracting the downloaded zip file with the different software.\n\n`,
        ),
      );
      throw e;
    }

    numberOfRecords += 1;

    const pickReason = derivePickReason(
      objectData,
      territoryConfig,
      territoryExtent,
    );
    if (!pickReason) {
      continue;
    }

    numberOfObjectsByPickReason[pickReason] += 1;
    const objectFilePath = getMkrfObjectFilePath(objectData.nativeId);

    // Do not update the file if it originates from the same dump
    if (await fs.pathExists(objectFilePath)) {
      const existingObject = (await fs.readJson(
        objectFilePath,
      )) as MkrfObjectFile;

      if (existingObject.dataDumpFileName === dataDumpFileName) {
        logger.log(`${chalk.gray(objectFilePath)} (${pickReason})`);
        continue;
      }
    }

    const objectFile: MkrfObjectFile = sortKeys(
      {
        ...objectData,
        dataDumpFileName,
        dataDumpProcessedAt,
      },
      { deep: true },
    );
    await writeFormattedJson(objectFilePath, objectFile);

    logger.log(`${chalk.magenta(objectFilePath)} (${pickReason})`);
  }

  lineStream.close();
  fileStream.close();

  const numberOfPickedObjects = _.sum(
    Object.values(numberOfObjectsByPickReason),
  );

  logger.log(
    `Done. Picked objects: ${numberOfPickedObjects} (${numberOfObjectsByPickReason["position"]} based on position and ${numberOfObjectsByPickReason["address"]} based on address). Number of records scanned: ${numberOfRecords}.`,
  );
};

autoStartCommandIfNeeded(extractObjectsFromJsonsDump, __filename);
