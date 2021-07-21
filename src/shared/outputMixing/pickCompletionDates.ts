import chalk from "chalk";

import {
  parseCompletionDates,
  ResultOfParseCompletionDates,
} from "../parseCompletionDates";
import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants } from "./types";

type PropertiesToPick =
  | "completionDates"
  | "completionDatesSource"
  | "derivedCompletionDatesForGeosemantica"
  | "derivedCompletionYear";

type YearRange = [number, number];

const tweakYearRange = (range: YearRange, source: string): YearRange => {
  if (range[0] === range[1]) {
    const year = range[0];

    if (year === 1900 && source === "rosreestr") {
      // 1900 in rosreestr often refers to a rough estimation of the year
      return [1840, 1930];
    } else if (year <= 1800 && year % 100 === 0 && source === "rosreestr") {
      // 1800 (and possibly 1700 etc) in rosreestr are often mistakes
      return [year - 20, Number.MAX_SAFE_INTEGER];
    } else if (year < 1920 && year % 10 === 0) {
      // any decade year before 1920 can be approximate (± 10 years)
      return [year - 10, year + 10];
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

export const pickCompletionDates: PickFromPropertyVariants<PropertiesToPick> = ({
  listRelevantPropertyVariants,
  logger,
  targetBuildArea,
}) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    callingFilePath: __filename,
    listRelevantPropertyVariants,
    logger,
    prioritizedSources: [
      "manual",
      "mkrf",
      "wikivoyage",
      "osm",
      "mingkh",
      "rosreestr",
      "wikimapia",
    ],
    propertySelectors: ["completionDates"],
    targetBuildArea,
  });

  let candidate:
    | (ResultOfParseCompletionDates & {
        completionDates: string;
        source: string;
      })
    | undefined = undefined;

  for (const propertyVariant of propertyVariants) {
    const { source, completionDates } = propertyVariant;
    if (typeof completionDates !== "string") {
      continue;
    }

    let resultOfParsing: ResultOfParseCompletionDates;
    try {
      resultOfParsing = parseCompletionDates(completionDates);
    } catch (e) {
      logger.log(chalk.yellow(e));
      if (!candidate) {
        candidate = {
          completionDates,
          source,
        };
      }
      continue;
    }

    if (!resultOfParsing.derivedCompletionYearRange) {
      if (!candidate) {
        candidate = { ...resultOfParsing, completionDates, source };
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
        completionDates,
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
    return {
      completionDates: candidate.completionDates,
      completionDatesSource: candidate.source,
      derivedCompletionDatesForGeosemantica:
        candidate.derivedCompletionDatesForGeosemantica,
      derivedCompletionYear: candidate.derivedCompletionYear,
    };
  }

  return undefined;
};
