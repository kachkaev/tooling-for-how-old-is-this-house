import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import _ from "lodash";

import { writeFormattedJson } from "../../../shared/helpersForJson";
import { getRegionExtent } from "../../../shared/region";
import {
  CenterInCombinedTileFeaturesData,
  combineTiles,
  FeatureType,
  getInfoPageDataFilePath,
  InfoPageData,
  InitialItemInInfoPage,
} from "../../../shared/sources/rosreestr";
import { getCnChunk } from "../../../shared/sources/rosreestr/helpersForCn";

const minNumberOfFeaturesPerBlock = 5;
const minPercentageOutsideRegionExtent = 25;
const pageSize = 100;
const tailLength = 50;

export const generateInfoPages: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/rosreestr: Generating info pages"));

  logger.log(chalk.green("Loading CCOs from tiles..."));
  const { featureCenters: ccoCentersInTiles } = await combineTiles({
    featureType: "cco",
    logger,
  });

  logger.log(chalk.green("Loading lots from tiles..."));
  const { featureCenters: lotCentersInTiles } = await combineTiles({
    featureType: "lot",
    logger,
  });

  process.stdout.write(chalk.green("Indexing by cadastral number..."));

  const regionExtent = await getRegionExtent();
  const wrappedFeatureByCn: Record<
    string,
    {
      featureType: FeatureType;
      center: CenterInCombinedTileFeaturesData;
    }
  > = {};
  for (const [featureType, features] of [
    ["cco", ccoCentersInTiles],
    ["lot", lotCentersInTiles],
  ] as const) {
    for (const centerFeature of features) {
      if (!centerFeature.properties?.cn) {
        throw new Error(
          `Found feature ${featureType} without cn (cadastral number): ${JSON.stringify(
            centerFeature,
          )}`,
        );
      }
      if (wrappedFeatureByCn[centerFeature.properties.cn]) {
        throw new Error(
          `Found feature ${featureType} with an already used cn (cadastral number): ${JSON.stringify(
            centerFeature,
          )}`,
        );
      }
      wrappedFeatureByCn[centerFeature.properties.cn] = {
        featureType,
        center: centerFeature,
      };
    }
  }

  const wrappedFeatures = Object.values(wrappedFeatureByCn);
  const wrappedFeaturesByBlock = _.groupBy(wrappedFeatures, (wrappedFeature) =>
    getCnChunk(wrappedFeature.center.properties?.cn ?? "", 0, 3),
  );

  const blockTuples = _.orderBy(
    Object.entries(wrappedFeaturesByBlock),
    (tuple) => tuple[0],
  );
  // .slice(0, 30);

  logger.log(
    ` Found ${wrappedFeatures.length} features (${ccoCentersInTiles.length} CCOs and ${lotCentersInTiles.length} lots) in ${blockTuples.length} blocks.`,
  );

  let totalEstimatedRequestCount = 0;
  let totalPageCount = 0;
  let totalBlockCount = 0;
  for (const [block, wrappedFeaturesInCurrentBlock] of blockTuples) {
    const maxFoundId = Math.max(
      ...wrappedFeaturesInCurrentBlock.map((wrappedFeature) =>
        parseInt(getCnChunk(wrappedFeature.center.properties?.cn ?? "0", 3)),
      ),
    );

    logger.log(
      `${chalk.green(`Block ${block}`)} – features: ${
        wrappedFeaturesInCurrentBlock.length
      }, max found id: ${maxFoundId}`,
    );
    if (wrappedFeaturesInCurrentBlock.length < minNumberOfFeaturesPerBlock) {
      logger.log(
        chalk.yellow(
          `Block skipped because feature count is ${wrappedFeaturesInCurrentBlock.length} (< ${minNumberOfFeaturesPerBlock})`,
        ),
      );
      continue;
    }

    const featuresOutsideRegionExtent = wrappedFeaturesInCurrentBlock.filter(
      ({ center }) => !turf.booleanPointInPolygon(center, regionExtent),
    );

    const percentageOutsideRegionExtent = Math.round(
      (featuresOutsideRegionExtent.length /
        wrappedFeaturesInCurrentBlock.length) *
        100,
    );
    if (percentageOutsideRegionExtent > minPercentageOutsideRegionExtent) {
      logger.log(
        chalk.yellow(
          `Does not qualify because ${percentageOutsideRegionExtent}% of features are outside region extent (> ${minPercentageOutsideRegionExtent})`,
        ),
      );
      continue;
    }

    const maxPageNumber = Math.floor((maxFoundId + tailLength) / pageSize);
    totalPageCount += maxPageNumber;

    totalEstimatedRequestCount +=
      maxPageNumber * pageSize -
      wrappedFeaturesInCurrentBlock.filter(
        ({ featureType }) => featureType === "lot",
      ).length;

    totalBlockCount += 1;

    for (let pageNumber = 0; pageNumber <= maxPageNumber; pageNumber += 1) {
      const infoPageData: InfoPageData = [];
      for (let index = 0; index < pageSize; index += 1) {
        if (index === 0 && pageNumber === 0) {
          continue;
        }
        const cn = `${block}:${pageNumber * pageSize + index}`;
        const featureType = wrappedFeatureByCn[cn]?.featureType;
        const item: InitialItemInInfoPage = {
          cn,
          creationReason:
            featureType === "cco"
              ? "ccoInTile"
              : featureType === "lot"
              ? "lotInTile"
              : "gap",
        };
        infoPageData.push(item);
      }

      const infoPageFilePath = getInfoPageDataFilePath(block, pageNumber);
      await writeFormattedJson(infoPageFilePath, infoPageData);
    }
    logger.log(chalk.magenta(`Pages total: ${maxPageNumber + 1}`));
  }
  logger.log(
    `Requests: ${totalEstimatedRequestCount}/${wrappedFeatures.length}, block count: ${totalBlockCount}/${blockTuples.length}, page count: ${totalPageCount}`,
  );
};

autoStartCommandIfNeeded(generateInfoPages, __filename);
