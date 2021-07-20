import { DataToOmitSelector, PropertySelector } from "./types";

const treatAsteriskAsUndefined = (
  value: string | undefined,
): string | undefined => {
  if (value === "*") {
    return undefined;
  }

  return value;
};

const knownPropertySelectorLookup: Record<PropertySelector, true> = {
  address: true,
  architect: true,
  buildingType: true,
  completionDates: true,
  documentedBuildArea: true,
  floorCount: true,
  name: true,
  photo: true,
  source: true,
  style: true,
  url: true,
  wikipediaUrl: true,
};

const knownPropertySelectors = Object.keys(
  knownPropertySelectorLookup,
) as PropertySelector[];

const isValidPropertySelector = (
  propertySelector: string,
): propertySelector is PropertySelector =>
  knownPropertySelectors.includes(propertySelector as PropertySelector);

export const parseDataToOmit = (
  dataToOmit: string | undefined,
  reportIssue: (issue: string) => void,
): undefined | DataToOmitSelector[] => {
  if (!dataToOmit) {
    return undefined;
  }
  const slices = dataToOmit.split(",").map((slice) => slice.trim());

  return slices
    .map<DataToOmitSelector | undefined>((slice) => {
      const [source, rawId, rawPropertyName] = slice
        .split("|")
        .map((value) => value.trim());

      if (!source) {
        reportIssue(`Unexpected empty value for source in "${dataToOmit}"`);

        return undefined;
      }

      const propertySelector = treatAsteriskAsUndefined(rawPropertyName);
      if (
        typeof propertySelector === "string" &&
        !isValidPropertySelector(propertySelector)
      ) {
        reportIssue(
          `Unexpected property selector "${propertySelector}" in "${dataToOmit}". Expected: "${knownPropertySelectors.join(
            '", "',
          )}".`,
        );

        return undefined;
      }

      return {
        source,
        id: treatAsteriskAsUndefined(rawId),
        propertyName: propertySelector,
      };
    })
    .filter((result): result is DataToOmitSelector => Boolean(result));
};

export const matchDataToOmitSelectors = (
  dataToOmitSelectors: DataToOmitSelector[],
  source: string,
  id: string,
  propertySelectors?: PropertySelector[],
) =>
  dataToOmitSelectors.some((selector) => {
    if (source !== selector.source) {
      return false;
    }

    const idMatches = !selector.id || id === selector.id;

    const propertyMatches =
      !selector.propertySelector ||
      propertySelectors?.includes(selector.propertySelector);

    if (idMatches && propertyMatches) {
      return true;
    }
  });
