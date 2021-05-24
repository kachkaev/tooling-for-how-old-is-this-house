import chalk from "chalk";

import { ParsedDataToOmitSelector } from "./types";

const treatAsteriskAsUndefined = (
  value: string | undefined,
): string | undefined => {
  if (value === "*") {
    return undefined;
  }

  return value;
};

export const parseDataToOmit = (
  dataToOmit: string,
  logger?: Console,
): ParsedDataToOmitSelector[] => {
  const slices = dataToOmit.split(",").map((slice) => slice.trim());

  return slices
    .map<ParsedDataToOmitSelector | undefined>((slice) => {
      const [source, rawId, rawPropertyName] = slice
        .split("|")
        .map((value) => value.trim());

      if (!source) {
        logger?.log(
          chalk.yellow(`Unexpected empty value for source in ${dataToOmit}`),
        );

        return undefined;
      }

      return {
        source,
        id: treatAsteriskAsUndefined(rawId),
        property: treatAsteriskAsUndefined(rawPropertyName),
      };
    })
    .filter((result): result is ParsedDataToOmitSelector => Boolean(result));
};
