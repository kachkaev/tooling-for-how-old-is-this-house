import chalk from "chalk";

import {
  parseCompletionTime,
  ResultOfParseCompletionTime,
} from "../parseCompletionTime";
import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants } from "./types";

type PropertiesToPick =
  | "completionTime"
  | "completionTimeSource"
  | "derivedCompletionTimeForGeosemantica"
  | "derivedCompletionYear";

type YearRange = [number, number];

const tweakYearRange = (range: YearRange, source: string): YearRange => {
  if (range[0] === range[1]) {
    const year = range[0];

    if (source === "rosreestr") {
      if (year === 1900) {
        // 1900 in rosreestr often refers to a rough estimation of the year
        return [1840, 1930];
      } else if (year <= 1800 && year % 100 === 0) {
        // 1800 (and possibly 1700 etc) in are often mistakes
        return [year - 20, Number.MAX_SAFE_INTEGER];
      } else if (year < 1920 && year % 10 === 0) {
        // any decade year before 1920 can be approximate (± 10 years)
        return [year - 10, year + 10];
      }
    }
  }

  return range;
};

const doRangesOverlap = (rangeA: YearRange, rangeB: YearRange): boolean => {
  return rangeA[0] <= rangeB[1] && rangeA[1] >= rangeB[0];
};

const getRangeDuration = (range: YearRange): number => {
  return range[1] - range[0];
};

export const pickCompletionTime: PickFromPropertyVariants<PropertiesToPick> = ({
  listRelevantPropertyVariants,
  output,
  targetBuildArea,
}) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    callingModuleUrl: import.meta.url,
    listRelevantPropertyVariants,
    output,
    prioritizedSources: [
      "manual",
      "mkrf",
      "wikivoyage",
      "osm",
      "mingkh",
      "rosreestr",
      "wikimapia",
    ],
    propertySelectors: ["completionTime"],
    targetBuildArea,
  });

  let candidate:
    | (ResultOfParseCompletionTime & {
        completionTime: string;
        source: string;
      })
    | undefined = undefined;

  for (const propertyVariant of propertyVariants) {
    const { source, completionTime } = propertyVariant;
    if (typeof completionTime !== "string") {
      continue;
    }

    let resultOfParsing: ResultOfParseCompletionTime;
    try {
      resultOfParsing = parseCompletionTime(completionTime);
    } catch (error) {
      output.write(`${chalk.yellow(error)}\n`);
      if (!candidate) {
        candidate = {
          completionTime,
          source,
        };
      }
      continue;
    }

    if (!resultOfParsing.derivedCompletionYearRange) {
      if (!candidate) {
        candidate = { ...resultOfParsing, completionTime, source };
      }
      if (propertyVariant.source === "manual") {
        break;
      }
      continue;
    }

    const currentRange = tweakYearRange(
      resultOfParsing.derivedCompletionYearRange,
      source,
    );

    const existingRange = candidate?.derivedCompletionYearRange;
    if (
      !existingRange ||
      (doRangesOverlap(currentRange, existingRange) &&
        getRangeDuration(currentRange) < getRangeDuration(existingRange))
    ) {
      candidate = {
        ...resultOfParsing,
        derivedCompletionYearRange: currentRange,
        completionTime,
        source,
      };
    }

    if (
      propertyVariant.source === "manual" ||
      currentRange[1] - currentRange[0] === 0
    ) {
      break;
    }
  }

  if (candidate) {
    const {
      completionTime,
      source,
      derivedCompletionTimeForGeosemantica,
      derivedCompletionYear,
    } = candidate;

    return {
      completionTime,
      completionTimeSource: source,
      ...(derivedCompletionTimeForGeosemantica
        ? { derivedCompletionTimeForGeosemantica }
        : {}),
      ...(derivedCompletionYear ? { derivedCompletionYear } : {}),
    };
  }

  return undefined;
};
