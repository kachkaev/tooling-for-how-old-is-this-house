import { deriveCompletionYearFromCompletionDates } from "../completionDates";
import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants, PropertyVariant } from "./types";

const usuallyAbnormalYears = [1800, 1900, 1910, 1917];

export const pickCompletionDates: PickFromPropertyVariants<
  "completionDates" | "completionDatesSource" | "derivedCompletionYear"
> = ({ listRelevantPropertyVariants, logger, targetBuildArea }) => {
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

  const propertyVariantsWithRoughYear: PropertyVariant[] = [];
  const propertyVariantsWithoutDerivedYear: PropertyVariant[] = [];
  for (const propertyVariant of propertyVariants) {
    if (typeof propertyVariant.completionDates !== "string") {
      continue;
    }
    const derivedCompletionYear = deriveCompletionYearFromCompletionDates(
      propertyVariant.completionDates,
    );

    if (propertyVariant.source !== "manual") {
      if (usuallyAbnormalYears.includes(derivedCompletionYear ?? 0)) {
        propertyVariantsWithRoughYear.push(propertyVariant);
        continue;
      }
      if (!derivedCompletionYear) {
        propertyVariantsWithoutDerivedYear.push(propertyVariant);
        continue;
      }
    }

    return {
      completionDates: propertyVariant.completionDates,
      completionDatesSource: propertyVariant.source,
      derivedCompletionYear,
    };
  }

  const fallbackPropertyVariant = [
    ...propertyVariantsWithRoughYear,
    ...propertyVariantsWithoutDerivedYear,
  ][0];

  if (fallbackPropertyVariant) {
    return {
      completionDates: fallbackPropertyVariant.completionDates,
      completionDatesSource: fallbackPropertyVariant.source,
      derivedCompletionYear: deriveCompletionYearFromCompletionDates(
        fallbackPropertyVariant.completionDates,
      ),
    };
  }

  return undefined;
};
