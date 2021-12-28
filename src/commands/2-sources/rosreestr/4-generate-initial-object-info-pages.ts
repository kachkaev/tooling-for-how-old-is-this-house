import {
  autoStartCommandIfNeeded,
  Command,
  CommandError,
} from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import dedent from "dedent";
import _ from "lodash";

import {
  combineRosreestrTiles,
  CreationReasonForObjectInInfoPage,
  ensureRosreestrInfoPage,
  ObjectCenterFeature,
  rosreestrObjectInfoPageSize,
  rosreestrObjectInfoPageTailLength,
} from "../../../shared/sources/rosreestr";
import {
  getCnChunk,
  isValidObjectCn,
} from "../../../shared/sources/rosreestr/helpersForCn";
import {
  getTerritoryConfig,
  getTerritoryExtent,
} from "../../../shared/territory";

const minNumberOfObjectsPerBlock = 5;
const minPercentageOutsideTerritoryExtent = 25;

const getHandpickedCnsForPageInfos = async (
  logger: Console | undefined,
): Promise<string[]> => {
  const handpickedCnsForPageInfos = (await getTerritoryConfig()).sources
    ?.rosreestr?.handpickedCnsForPageInfos;

  if (!handpickedCnsForPageInfos) {
    return [];
  }

  try {
    return handpickedCnsForPageInfos.map((cn) => {
      if (!isValidObjectCn(cn)) {
        throw new Error();
      }

      return cn;
    });
  } catch {
    logger?.log(
      "Expected territory config → sources → rosreestr → handpickedCnsForPageInfos to contain an array of cadastral numbers (××:××:×××××××:×××). Ignoring this setting.",
    );

    return [];
  }
};

const command: Command = async ({ logger }) => {
  logger.log(
    chalk.bold("sources/rosreestr: Generating initial object info pages"),
  );

  logger.log(chalk.green("Loading CCOs from tiles..."));
  const { objectCenterFeatures: ccoFeatures } = await combineRosreestrTiles({
    objectType: "cco",
    logger,
  });

  logger.log(chalk.green("Loading lots from tiles..."));
  const { objectCenterFeatures: lotFeatures } = await combineRosreestrTiles({
    objectType: "lot",
    logger,
  });

  logger.log(chalk.green("Generating lookups..."));

  const ccoFeatureByCn: Record<string, ObjectCenterFeature> = {};
  const lotFeatureByCn: Record<string, ObjectCenterFeature> = {};
  const handpickedEntryByCn: Record<string, true> = {};

  // Index CCOs in tiles
  for (const ccoFeature of ccoFeatures) {
    const cn = ccoFeature.properties?.cn;
    if (!isValidObjectCn(cn)) {
      throw new CommandError(
        `Found CCO without a valid cn property (cadastral number): ${JSON.stringify(
          ccoFeature,
        )}`,
      );
    }
    if (ccoFeatureByCn[cn]) {
      throw new CommandError(
        `Found CCO with an already used cadastral number for the same object type: ${JSON.stringify(
          ccoFeature,
        )}`,
      );
    }
    ccoFeatureByCn[cn] = ccoFeature;
  }

  // Index lots in tiles
  for (const lotFeature of lotFeatures) {
    const objectCn = lotFeature.properties?.cn;
    if (!isValidObjectCn(objectCn)) {
      throw new CommandError(
        `Found lot without cn property (cadastral number): ${JSON.stringify(
          lotFeature,
        )}`,
      );
    }
    if (lotFeatureByCn[objectCn]) {
      throw new CommandError(
        `Found lot with an already used cadastral number for the same object type: ${JSON.stringify(
          lotFeature,
        )}`,
      );
    }
    if (ccoFeatureByCn[objectCn]) {
      // Example: 72:17:1708003:561
      logger.log(
        chalk.yellow(
          `Found lot with an already used cadastral number for CCO: ${objectCn}. Ignoring lot.`,
        ),
      );
    }

    lotFeatureByCn[objectCn] = lotFeature;
  }

  // Index handpicked CNs defined in territory-config.yml
  const handpickedCnsForPageInfos = await getHandpickedCnsForPageInfos(logger);
  for (const objectCn of handpickedCnsForPageInfos) {
    if (ccoFeatureByCn[objectCn]) {
      logger.log(
        chalk.yellow(
          `You can remove ${objectCn} from handpickedCnsForPageInfos – it is present in tiles with CCOs`,
        ),
      );
      continue;
    }
    if (lotFeatureByCn[objectCn]) {
      logger.log(
        chalk.yellow(
          `You can remove ${objectCn} from handpickedCnsForPageInfos – it is present in tiles with lots`,
        ),
      );
      continue;
    }
    handpickedEntryByCn[objectCn] = true;
  }

  const knownObjectCns = [
    ...Object.keys(ccoFeatureByCn),
    ...Object.keys(lotFeatureByCn),
    ...Object.keys(handpickedEntryByCn),
  ];

  if (_.uniq(knownObjectCns).length !== knownObjectCns.length) {
    logger.log(
      chalk.red(
        "Found duplicates in cadastral numbers for new objects. Please report a bug and share the data you’ve been working with.",
      ),
    );
  }

  const knownObjectCnsByBlockCn = _.groupBy(knownObjectCns, (objectCn) =>
    getCnChunk(objectCn, 0, 3),
  );

  const orderedBlockCns = _.orderBy(Object.keys(knownObjectCnsByBlockCn));

  logger.log(
    `Found ${knownObjectCns.length} objects (${ccoFeatures.length} CCOs and ${lotFeatureByCn.length} lots) in ${orderedBlockCns.length} blocks.`,
  );

  const territoryExtent = await getTerritoryExtent();

  let totalEstimatedRequestCount = 0;
  let totalPageCount = 0;
  let totalWrittenPageCount = 0;
  let totalBlockCount = 0;
  for (const blockCn of orderedBlockCns) {
    const knownObjectCnsInBlock = knownObjectCnsByBlockCn[blockCn];
    if (!knownObjectCnsInBlock) {
      logger.log(
        chalk.red(
          `No objects found in block ${blockCn}. Please report a bug and share the data you’ve been working with.`,
        ),
      );
      continue;
    }

    const maxFoundId = Math.max(
      ...knownObjectCnsInBlock.map((objectCn) =>
        parseInt(getCnChunk(objectCn, 3)),
      ),
    );

    logger.log(
      `${chalk.green(`Block ${blockCn}`)} – known objects: ${
        knownObjectCnsInBlock.length
      }, max found id: ${maxFoundId}`,
    );

    const handpickedObjectsCnsInBlock = knownObjectCnsInBlock.filter(
      (objectCn) => Boolean(handpickedEntryByCn[objectCn]),
    );

    if (knownObjectCnsInBlock.length < minNumberOfObjectsPerBlock) {
      if (handpickedObjectsCnsInBlock.length) {
        logger.log(
          chalk.cyan(
            "  Feature count is too low, but block is still picked because of territory config → sources → rosreestr → handpickedCnsForPageInfos",
          ),
        );
      } else {
        logger.log(
          chalk.yellow(
            `  Block is skipped because known feature count is ${knownObjectCnsInBlock.length} (< ${minNumberOfObjectsPerBlock})`,
          ),
        );
        continue;
      }
    }

    const objectsCnsOutsideTerritoryExtent = knownObjectCnsInBlock.filter(
      (objectCn) => {
        const feature = ccoFeatureByCn[objectCn] ?? lotFeatureByCn[objectCn];
        if (!feature) {
          return false;
        }

        return !turf.booleanPointInPolygon(feature.geometry, territoryExtent);
      },
    );

    const percentageOutsideTerritoryExtent = Math.round(
      (objectsCnsOutsideTerritoryExtent.length / knownObjectCnsInBlock.length) *
        100,
    );

    if (
      percentageOutsideTerritoryExtent > minPercentageOutsideTerritoryExtent
    ) {
      if (handpickedObjectsCnsInBlock.length) {
        logger.log(
          chalk.cyan(
            "  Too many objects are outside territory extent, but block is still picked because of territory config → sources → rosreestr → handpickedCnsForPageInfos",
          ),
        );
      } else {
        logger.log(
          chalk.yellow(
            `  Block is skipped because ${percentageOutsideTerritoryExtent}% of objects are outside territory extent (> ${minPercentageOutsideTerritoryExtent})`,
          ),
        );
        continue;
      }
    }

    const maxPageNumber = Math.floor(
      (maxFoundId + rosreestrObjectInfoPageTailLength) /
        rosreestrObjectInfoPageSize,
    );
    totalPageCount += maxPageNumber;

    const lotCnsInBlock = knownObjectCnsInBlock.filter((objectCn) =>
      Boolean(lotFeatureByCn[objectCn]),
    );

    totalEstimatedRequestCount +=
      maxPageNumber * rosreestrObjectInfoPageSize - lotCnsInBlock.length;

    totalBlockCount += 1;

    let writtenPageCountInBlock = 0;
    for (let pageNumber = 0; pageNumber <= maxPageNumber; pageNumber += 1) {
      const creationReasonByObjectCn: Record<
        string,
        CreationReasonForObjectInInfoPage
      > = {};

      knownObjectCnsInBlock.forEach((objectCn) => {
        const creationReason: CreationReasonForObjectInInfoPage | undefined =
          ccoFeatureByCn[objectCn]
            ? "ccoInTile"
            : lotFeatureByCn[objectCn]
            ? "lotInTile"
            : handpickedEntryByCn[objectCn]
            ? "handpicked"
            : undefined;

        if (creationReason) {
          creationReasonByObjectCn[objectCn] = creationReason;
        }
      });

      const pageWasWritten = await ensureRosreestrInfoPage({
        blockCn,
        pageNumber,
        creationReasonByObjectCn,
      });

      if (pageWasWritten) {
        writtenPageCountInBlock += 1;
      }
    }

    logger.log(
      (writtenPageCountInBlock ? chalk.magenta : chalk.gray)(
        `  Pages total: ${
          maxPageNumber + 1
        } (${writtenPageCountInBlock} written to disk)`,
      ),
    );
    totalWrittenPageCount += writtenPageCountInBlock;
  }
  logger.log(dedent`
    Done.
      Known object CNs (cadastral numbers): ${knownObjectCns.length} 
      Known blocks: ${orderedBlockCns.length}
      Picked blocks: ${totalBlockCount}
      Predicted number of API requests: ${totalEstimatedRequestCount}
      Number of info pages: ${totalPageCount} (${totalWrittenPageCount} written to disk)
  `);
};

autoStartCommandIfNeeded(command, __filename);

export default command;
