import { deriveCompletionYearFromCompletionDates } from "../completionDates";
import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants, PropertyVariant } from "./types";

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
      "mingkh",
      "rosreestr",
      "osm",
      "wikimapia",
    ],
    propertySelectors: ["completionDates"],
    targetBuildArea,
  });

  const propertyVariantsWithRoughYear: PropertyVariant[] = [];
  const propertyVariantsWithoutDerivedYear: PropertyVariant[] = [];
  for (const propertyVariant of propertyVariants) {
    if (!propertyVariant.completionDates) {
      continue;
    }

    const derivedCompletionYear = deriveCompletionYearFromCompletionDates(
      propertyVariant.completionDates,
    );

    if ([1900, 1910, 1917].includes(derivedCompletionYear ?? 0)) {
      propertyVariantsWithRoughYear.push(propertyVariant);
      continue;
    }
    if (!derivedCompletionYear) {
      propertyVariantsWithoutDerivedYear.push(propertyVariant);
      continue;
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
