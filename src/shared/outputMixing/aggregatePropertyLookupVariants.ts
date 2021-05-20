import { deriveCompletionYearFromCompletionDates } from "../completionDates";
import { generateFilterPropertyVariantLookup } from "./generateFilterPropertyVariantLookup";
import { PropertyVariantLookup, PropertyVariantLookupAggregate } from "./types";

export const aggregatePropertyVariantLookups = (
  propertyVariantLookups: PropertyVariantLookup[],
  logger?: Console,
): PropertyVariantLookupAggregate => {
  const result: PropertyVariantLookupAggregate = {};

  const filterPropertyVariantLookup = generateFilterPropertyVariantLookup(
    propertyVariantLookups,
    logger,
  );

  // TODO: order variants by priority
  const preFilteredPropertyVariantLookups = propertyVariantLookups.filter(
    (propertyVariantLookup) =>
      filterPropertyVariantLookup(propertyVariantLookup),
  );

  // Pick completion dates
  for (const propertyVariantLookup of preFilteredPropertyVariantLookups) {
    if (propertyVariantLookup.completionDates) {
      const derivedCompletionYear = deriveCompletionYearFromCompletionDates(
        propertyVariantLookup.completionDates,
      );
      if (derivedCompletionYear) {
        result.completionDates = propertyVariantLookup.completionDates;
        result.completionDatesSource = propertyVariantLookup.source;
        result.derivedCompletionYear = derivedCompletionYear;
        break;
      }
    }
  }

  // Pick address
  for (const propertyVariantLookup of preFilteredPropertyVariantLookups) {
    if (propertyVariantLookup.address) {
      result.address = propertyVariantLookup.address;
      result.addressSource = propertyVariantLookup.source;
      break;
    }
  }

  return result;
};
