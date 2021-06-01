import { DataToOmitSelector, PropertyNameInDataToOmitSelector } from "./types";

const treatAsteriskAsUndefined = (
  value: string | undefined,
): string | undefined => {
  if (value === "*") {
    return undefined;
  }

  return value;
};

const propertyNameInDataToOmitSelectorLookup: Record<
  PropertyNameInDataToOmitSelector,
  true
> = {
  address: true,
  buildingType: true,
  completionDates: true,
  documentedBuildArea: true,
  floorCount: true,
  name: true,
  photo: true,
  source: true,
  url: true,
  wikipediaUrl: true,
};

const propertyNamesInDataToOmitSelector = Object.keys(
  propertyNameInDataToOmitSelectorLookup,
) as PropertyNameInDataToOmitSelector[];

const isValidPropertyNameInDataToOmitSelector = (
  propertyName: string,
): propertyName is PropertyNameInDataToOmitSelector =>
  (propertyNamesInDataToOmitSelector as string[]).includes(propertyName);

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

      const propertyName = treatAsteriskAsUndefined(rawPropertyName);
      if (
        typeof propertyName === "string" &&
        !isValidPropertyNameInDataToOmitSelector(propertyName)
      ) {
        reportIssue(`Unexpected property ${propertyName} in "${dataToOmit}"`);

        return undefined;
      }

      return {
        source,
        id: treatAsteriskAsUndefined(rawId),
        propertyName,
      };
    })
    .filter((result): result is DataToOmitSelector => Boolean(result));
};

export const matchDataToOmitSelectors = (
  dataToOmitSelectors: DataToOmitSelector[],
  source: string,
  id: string,
  propertyNames?: PropertyNameInDataToOmitSelector[],
) =>
  dataToOmitSelectors.some((selector) => {
    if (source !== selector.source) {
      return false;
    }

    const idMatches = !selector.id || id === selector.id;

    const propertyMatches =
      !selector.property || propertyNames?.includes(selector.property);

    if (idMatches && propertyMatches) {
      return true;
    }
  });
