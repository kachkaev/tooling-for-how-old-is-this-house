import chalk from "chalk";
import _ from "lodash";

import { buildGlobalFeatureOrVariantId } from "./helpersForProperties";
import {
  ListRelevantPropertyVariants,
  PropertySelector,
  PropertyVariant,
} from "./types";

const calculatePercentageDifference = (a: number, b: number): number => {
  if (b > a) {
    return (b / a - 1) * 100;
  }

  return (a / b - 1) * 100;
};

const alreadyLoggedWarningsSet = new Set<string>();

export const prioritizeRelevantPropertyVariants = ({
  listRelevantPropertyVariants,
  logger,
  prioritizedSources,
  propertySelectors,
  targetBuildArea,
}: {
  listRelevantPropertyVariants: ListRelevantPropertyVariants;
  logger: Console;
  prioritizedSources: string[];
  propertySelectors: PropertySelector[];
  targetBuildArea: number;
}): PropertyVariant[] => {
  const relevantPropertyVariants = listRelevantPropertyVariants(
    propertySelectors,
  );

  const unrecognizedSourcesSet = new Set<string>();
  const orderedPropertyVariants = _.orderBy(relevantPropertyVariants, [
    // Place variants with mismatching build area towards the end of the list
    ({ derivedBuildArea, documentedBuildArea }) => {
      const buildArea = derivedBuildArea ?? documentedBuildArea;
      if (!buildArea) {
        return 0;
      }

      return calculatePercentageDifference(buildArea, targetBuildArea) > 100
        ? 1
        : 0;
    },

    // Order variants by source priority
    ({ source }) => {
      const sourceIndex = prioritizedSources.indexOf(source);
      if (sourceIndex === -1) {
        unrecognizedSourcesSet.add(source);

        return Number.MAX_SAFE_INTEGER;
      }

      return sourceIndex;
    },

    // Within each group, order by id for consistency
    ({ source, id }) => buildGlobalFeatureOrVariantId(source, id),
  ]);

  const unrecognizedSources = _.orderBy([...unrecognizedSourcesSet]);
  for (const unrecognizedSource of unrecognizedSources) {
    const warningHash = JSON.stringify([unrecognizedSource, propertySelectors]);
    if (!alreadyLoggedWarningsSet.has(warningHash)) {
      alreadyLoggedWarningsSet.add(warningHash);
      logger.log(
        chalk.yellow(
          `Unexpected to find source "${unrecognizedSource}" when picking "${propertySelectors.join(
            '", "',
          )}". Please add it to a corresponding src/shared/outputMixing/pick*.ts file to ensure the right priority.`,
        ),
      );
    }
  }

  return orderedPropertyVariants;
};
