import { parseDataToIgnore } from "./parseDataToIgnore";
import { PropertyVariantLookup } from "./types";

type FilterPropertyVariantLookup = (
  propertyVariantLookup: PropertyVariantLookup,
  propertyName?: keyof PropertyVariantLookup,
) => boolean;

export const generateFilterPropertyVariantLookup = (
  propertyVariantLookups: PropertyVariantLookup[],
  logger?: Console,
): FilterPropertyVariantLookup => {
  const lookupsWithDataToIgnore = propertyVariantLookups.filter(
    (propertyVariantLookup) => propertyVariantLookup.dataToIgnore,
  );
  const dataToIgnore = lookupsWithDataToIgnore[0]?.dataToIgnore;

  if (!dataToIgnore) {
    return () => true;
  }

  if (lookupsWithDataToIgnore.length > 1 && logger) {
    const serializedValues = propertyVariantLookups
      .map((propertyVariantLookup) => `"${propertyVariantLookup.dataToIgnore}"`)
      .join(", ");

    logger?.log(
      `Expected only one properties variant with dataToIgnore, found ${lookupsWithDataToIgnore.length}: ${serializedValues}. Using the first one.`,
    );
  }

  const dataToIgnoreSelectors = parseDataToIgnore(dataToIgnore, logger);

  const result: FilterPropertyVariantLookup = (
    propertyVariantLookup,
    propertyName,
  ) => {
    for (const selector of dataToIgnoreSelectors) {
      if (propertyVariantLookup.source !== selector.source) {
        continue;
      }

      const idMatches =
        !selector.id || propertyVariantLookup.id === selector.id;

      const propertyMatches =
        !selector.property ||
        (propertyName &&
          propertyVariantLookup[propertyName] === selector.property);

      if (idMatches && propertyMatches) {
        return false;
      }
    }

    return true;
  };

  return result;
};
