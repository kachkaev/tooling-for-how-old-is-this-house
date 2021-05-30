import { DataToOmitSelector } from "./types";

const treatAsteriskAsUndefined = (
  value: string | undefined,
): string | undefined => {
  if (value === "*") {
    return undefined;
  }

  return value;
};

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
        reportIssue(`Unexpected empty value for source in ${dataToOmit}`);

        return undefined;
      }

      return {
        source,
        id: treatAsteriskAsUndefined(rawId),
        property: treatAsteriskAsUndefined(rawPropertyName),
      };
    })
    .filter((result): result is DataToOmitSelector => Boolean(result));
};

export const matchDataToOmitSelectors = (
  dataToOmitSelectors: DataToOmitSelector[],
  source: string,
  id: string,
  propertyName?: string,
) =>
  dataToOmitSelectors.some((selector) => {
    if (source !== selector.source) {
      return false;
    }

    const idMatches = !selector.id || id === selector.id;

    const propertyMatches =
      !selector.property ||
      (propertyName && propertyName === selector.property);

    if (idMatches && propertyMatches) {
      return true;
    }
  });
