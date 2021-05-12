import {
  autoStartCommandIfNeeded,
  Command,
  CommandError,
} from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import _ from "lodash";

import { writeFormattedJson } from "../../../shared/helpersForJson";
import {
  combineRosreestrTiles,
  getObjectInfoPageFilePath,
  InfoPageData,
  InfoPageObject,
  ObjectCenterFeature,
  RosreestrObjectType,
} from "../../../shared/sources/rosreestr";
import { getCnChunk } from "../../../shared/sources/rosreestr/helpersForCn";
import { getTerritoryExtent } from "../../../shared/territory";

const minNumberOfObjectsPerBlock = 5;
const minPercentageOutsideTerritoryExtent = 25;
const pageSize = 100;
const tailLength = 50;

export const generateObjectInfoPages: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/rosreestr: Generating object info pages"));

  logger.log(chalk.green("Loading CCOs from tiles..."));
  const {
    objectCenterFeatures: ccoCentersInTiles,
  } = await combineRosreestrTiles({
    objectType: "cco",
    logger,
  });

  logger.log(chalk.green("Loading lots from tiles..."));
  const {
    objectCenterFeatures: lotCentersInTiles,
  } = await combineRosreestrTiles({
    objectType: "lot",
    logger,
  });

  process.stdout.write(chalk.green("Indexing by cadastral number..."));

  const territoryExtent = await getTerritoryExtent();
  const objectByCn: Record<
    string,
    {
      objectType: RosreestrObjectType;
      center: ObjectCenterFeature;
    }
  > = {};
  for (const [objectType, objectFeatures] of [
    ["cco", ccoCentersInTiles],
    ["lot", lotCentersInTiles],
  ] as const) {
    for (const objectFeature of objectFeatures) {
      if (!objectFeature.properties?.cn) {
        throw new CommandError(
          `Found object ${objectType} without cn (cadastral number): ${JSON.stringify(
            objectFeature,
          )}`,
        );
      }
      const objectWithSameCn = objectByCn[objectFeature.properties.cn];
      if (objectWithSameCn) {
        if (objectWithSameCn.objectType === objectType) {
          throw new CommandError(
            `Found object ${objectType} with an already used cadastral number for the same object type: ${JSON.stringify(
              objectFeature.type,
            )}`,
          );
        }

        // Example: 72:17:1708003:561
        logger.log(
          chalk.yellow(
            `Found object ${objectType} with an already used cadastral number for ${
              objectWithSameCn.objectType
            }: ${JSON.stringify(objectFeature)}. Ignoring lot.`,
          ),
        );
        if (objectWithSameCn.objectType === "cco") {
          continue;
        }
      }
      objectByCn[objectFeature.properties.cn] = {
        objectType,
        center: objectFeature,
      };
    }
  }

  const objects = Object.values(objectByCn);
  const objectsByBlock = _.groupBy(objects, (wrappedFeature) =>
    getCnChunk(wrappedFeature.center.properties?.cn ?? "", 0, 3),
  );

  const blockTuples = _.orderBy(
    Object.entries(objectsByBlock),
    (tuple) => tuple[0],
  );

  logger.log(
    ` Found ${objects.length} objects (${ccoCentersInTiles.length} CCOs and ${lotCentersInTiles.length} lots) in ${blockTuples.length} blocks.`,
  );

  let totalEstimatedRequestCount = 0;
  let totalPageCount = 0;
  let totalBlockCount = 0;
  for (const [block, objectsInCurrentBlock] of blockTuples) {
    const maxFoundId = Math.max(
      ...objectsInCurrentBlock.map((wrappedFeature) =>
        parseInt(getCnChunk(wrappedFeature.center.properties?.cn ?? "0", 3)),
      ),
    );

    logger.log(
      `${chalk.green(`Block ${block}`)} – features: ${
        objectsInCurrentBlock.length
      }, max found id: ${maxFoundId}`,
    );
    if (objectsInCurrentBlock.length < minNumberOfObjectsPerBlock) {
      logger.log(
        chalk.yellow(
          `Block skipped because feature count is ${objectsInCurrentBlock.length} (< ${minNumberOfObjectsPerBlock})`,
        ),
      );
      continue;
    }

    const objectsOutsideTerritoryExtent = objectsInCurrentBlock.filter(
      ({ center }) => !turf.booleanPointInPolygon(center, territoryExtent),
    );

    const percentageOutsideTerritoryExtent = Math.round(
      (objectsOutsideTerritoryExtent.length / objectsInCurrentBlock.length) *
        100,
    );
    if (
      percentageOutsideTerritoryExtent > minPercentageOutsideTerritoryExtent
    ) {
      logger.log(
        chalk.yellow(
          `Does not qualify because ${percentageOutsideTerritoryExtent}% of objects are outside territory extent (> ${minPercentageOutsideTerritoryExtent})`,
        ),
      );
      continue;
    }

    const maxPageNumber = Math.floor((maxFoundId + tailLength) / pageSize);
    totalPageCount += maxPageNumber;

    totalEstimatedRequestCount +=
      maxPageNumber * pageSize -
      objectsInCurrentBlock.filter(({ objectType }) => objectType === "lot")
        .length;

    totalBlockCount += 1;

    for (let pageNumber = 0; pageNumber <= maxPageNumber; pageNumber += 1) {
      const infoPageData: InfoPageData = [];
      for (let index = 0; index < pageSize; index += 1) {
        if (index === 0 && pageNumber === 0) {
          continue;
        }
        const cn = `${block}:${pageNumber * pageSize + index}`;
        const objectType = objectByCn[cn]?.objectType;
        const item: InfoPageObject = {
          cn,
          creationReason:
            objectType === "cco"
              ? "ccoInTile"
              : objectType === "lot"
              ? "lotInTile"
              : "gap",
          firFetchedAt: null, // This line reduces git diffs data files
          pkkFetchedAt: null, // This line reduces git diffs data files
        };
        infoPageData.push(item);
      }

      const infoPageFilePath = getObjectInfoPageFilePath(block, pageNumber);
      await writeFormattedJson(infoPageFilePath, infoPageData);
    }
    logger.log(chalk.magenta(`Pages total: ${maxPageNumber + 1}`));
  }
  logger.log(
    `Requests: ${totalEstimatedRequestCount}/${objects.length}, block count: ${totalBlockCount}/${blockTuples.length}, page count: ${totalPageCount}`,
  );
};

autoStartCommandIfNeeded(generateObjectInfoPages, __filename);
