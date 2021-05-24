import { parseDataToOmit } from "./parseDataToOmit";
import { FilterPropertyVariantLookup, PropertyVariantLookup } from "./types";

export const generateFilterPropertyVariantLookup = (
  propertyVariantLookups: PropertyVariantLookup[],
  logger?: Console,
): FilterPropertyVariantLookup => {
  const lookupsWithDataToOmit = propertyVariantLookups.filter(
    (propertyVariantLookup) => propertyVariantLookup.dataToOmit,
  );
  const dataToOmit = lookupsWithDataToOmit[0]?.dataToOmit;

  if (!dataToOmit) {
    return () => true;
  }

  if (lookupsWithDataToOmit.length > 1 && logger) {
    const serializedValues = propertyVariantLookups
      .map((propertyVariantLookup) => `"${propertyVariantLookup.dataToOmit}"`)
      .join(", ");

    logger?.log(
      `Expected only one properties variant with dataToOmit, found ${lookupsWithDataToOmit.length}: ${serializedValues}. Using the first one.`,
    );
  }

  const dataToOmitSelectors = parseDataToOmit(dataToOmit, logger);

  return (propertyVariantLookup, propertyName) =>
    !dataToOmitSelectors.some((selector) => {
      if (propertyVariantLookup.source !== selector.source) {
        return false;
      }

      const idMatches =
        !selector.id || propertyVariantLookup.id === selector.id;

      const propertyMatches =
        !selector.property ||
        (propertyName && propertyName === selector.property);

      if (idMatches && propertyMatches) {
        return true;
      }
    });
};
