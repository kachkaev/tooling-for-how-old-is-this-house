import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import sortKeys from "sort-keys";

import { generateProgress } from "../../../shared/helpersForCommands";
import {
  serializeTime,
  writeFormattedJson,
} from "../../../shared/helpersForJson";
import {
  getRegionConfig,
  getRegionExtent,
  RegionConfig,
} from "../../../shared/region";
import {
  getMkrfJsonsDumpFilePath,
  getMkrfObjectFilePath,
  MkrfObjectData,
  MkrfObjectFile,
} from "../../../shared/sources/mkrf";

type PickReason = "position" | "address";

const derivePickReason = (
  objectData: MkrfObjectData,
  regionConfig: RegionConfig,
  regionExtent: turf.Feature<turf.Polygon | turf.MultiPolygon>,
): PickReason | undefined => {
  const position =
    objectData.data.general.additionalCoordinates?.[0] ??
    objectData.data.general.address?.mapPosition;

  if (position) {
    if (turf.booleanContains(regionExtent, position)) {
      return "position";
    }
  }

  const fallbackAddressSelectors =
    regionConfig?.sources?.mkrf
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

  const regionConfig = await getRegionConfig();
  const regionExtent = await getRegionExtent();

  process.stdout.write(chalk.green("Loading data..."));
  const jsonsDumpFilePath = getMkrfJsonsDumpFilePath();
  const jsonsDump = await fs.readFile(jsonsDumpFilePath, "utf8");
  const records = jsonsDump.split("\n");
  records.pop(); // Remove end of file line break
  const recordCount = records.length;
  process.stdout.write(` Done. Total records: ${recordCount}\n`);

  const dataDumpFileName = path.basename(jsonsDumpFilePath);
  const dataDumpProcessedAt = serializeTime();

  logger.log(
    chalk.green(
      "Scanning through objects and saving those within region extent...",
    ),
  );

  const numberOfObjectsByPickReason: Record<PickReason, number> = {
    address: 0,
    position: 0,
  };

  for (let index = 0; index < recordCount; index += 1) {
    if (!(index % 10000) || index === recordCount - 1) {
      logger.log(generateProgress(index - 1, recordCount));
    }

    let objectData: MkrfObjectData;
    try {
      objectData = JSON.parse(records[index] ?? "") as MkrfObjectData;
    } catch (e) {
      logger.log(
        chalk.red(
          `\n\nUnexpected JSON parse error occurred on row ${
            index + 1
          }. JSON content:\n\n${
            records[index]
          }\n\nThis can happen if the file has been truncated when unpacking. Please try extracting the downloaded zip file with the different software.\n\n`,
        ),
      );
      throw e;
    }

    const pickReason = derivePickReason(objectData, regionConfig, regionExtent);
    if (!pickReason) {
      continue;
    }

    numberOfObjectsByPickReason[pickReason] += 1;
    const objectFilePath = getMkrfObjectFilePath(objectData.nativeId);

    if (await fs.pathExists(objectFilePath)) {
      logger.log(`${chalk.gray(objectFilePath)} (${pickReason})`);
      continue;
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

  const numberOfPickedObjects = _.sum(
    Object.values(numberOfObjectsByPickReason),
  );

  logger.log(
    `Done. Picked objects: ${numberOfPickedObjects} (${numberOfObjectsByPickReason["position"]} based on position and ${numberOfObjectsByPickReason["address"]} based on address).`,
  );
};

autoStartCommandIfNeeded(extractObjectsFromJsonsDump, __filename);
