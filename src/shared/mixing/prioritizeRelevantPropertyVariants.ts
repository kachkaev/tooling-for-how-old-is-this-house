import chalk from "chalk";
import _ from "lodash";
import { WriteStream } from "node:tty";

import {
  ListRelevantPropertyVariants,
  PropertySelector,
  PropertyVariant,
} from "./types";

/**
 * hello|42|world11
 * ↓
 * hello|0000000042|world0000000011
 */
const prependZerosToNumbersToImproveOrdering = (id: string): string =>
  id.replace(/\d+/g, (match) => match.padStart(10, "0"));

const calculatePercentageDifference = (a: number, b: number): number => {
  if (b > a) {
    return (b / a - 1) * 100;
  }

  return (a / b - 1) * 100;
};

const alreadyLoggedWarningsSet = new Set<string>();

export const prioritizeRelevantPropertyVariants = ({
  callingModuleUrl,
  listRelevantPropertyVariants,
  output,
  prioritizedSources,
  propertySelectors,
  targetBuildArea,
}: {
  callingModuleUrl: string;
  listRelevantPropertyVariants: ListRelevantPropertyVariants;
  output: WriteStream;
  prioritizedSources: string[];
  propertySelectors: PropertySelector[];
  targetBuildArea: number;
}): PropertyVariant[] => {
  const relevantPropertyVariants =
    listRelevantPropertyVariants(propertySelectors);

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

    // Within each group, start with geocoded objects...
    ({ externalGeometrySource }) => (externalGeometrySource ? 1 : 0),
    // ...order by build area DESC...
    ({ derivedBuildArea }) => (derivedBuildArea ? -derivedBuildArea : 0),
    // ...and finally by id within source for consistency
    ({ id }) => prependZerosToNumbersToImproveOrdering(id),
  ]);

  const unrecognizedSources = _.orderBy([...unrecognizedSourcesSet]);
  for (const unrecognizedSource of unrecognizedSources) {
    const warningHash = JSON.stringify([unrecognizedSource, propertySelectors]);
    if (!alreadyLoggedWarningsSet.has(warningHash)) {
      alreadyLoggedWarningsSet.add(warningHash);
      const callingFilePath = new URL(callingModuleUrl).pathname;
      output.write(
        chalk.yellow(
          `Unexpected to find source "${unrecognizedSource}" when picking "${propertySelectors.join(
            '", "',
          )}". Please add it to a corresponding ${callingFilePath} to ensure the right priority.\n`,
        ),
      );
    }
  }

  return orderedPropertyVariants;
};
