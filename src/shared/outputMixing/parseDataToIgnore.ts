import { ParsedDataToIgnoreSelector } from "./types";

const treatAsteriskAsUndefined = (
  value: string | undefined,
): string | undefined => {
  if (value === "*") {
    return undefined;
  }

  return value;
};

export const parseDataToIgnore = (
  dataToIgnore: string,
  logger?: Console,
): ParsedDataToIgnoreSelector[] => {
  const slices = dataToIgnore.split(",").map((slice) => slice.trim());

  return slices
    .map<ParsedDataToIgnoreSelector | undefined>((slice) => {
      const [source, rawId, rawPropertyName] = slice
        .split("|")
        .map((value) => value.trim());

      if (!source) {
        logger?.log(`Unexpected empty value for source in ${dataToIgnore}`);

        return undefined;
      }

      return {
        source,
        id: treatAsteriskAsUndefined(rawId),
        property: treatAsteriskAsUndefined(rawPropertyName),
      };
    })
    .filter((result): result is ParsedDataToIgnoreSelector => Boolean(result));
};
