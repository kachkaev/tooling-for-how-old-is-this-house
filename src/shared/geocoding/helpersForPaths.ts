import path from "path";

import {
  AddressNodeWithSemanticPart,
  AddressNormalizationConfig,
  buildCleanedAddressAst,
  buildStandardizedAddressAst,
  printStandardizedAddressSection,
} from "../addresses";
import { AddressInterpretationError } from "../addresses/AddressInterpretationError";
import {
  ensureTerritoryGitignoreContainsLine,
  getTerritoryDirPath,
} from "../territory";

export const getGeocodeDictionariesDirPath = () => {
  return path.resolve(getTerritoryDirPath(), "geocoding");
};

export const getGeocodeDictionaryFileName = () => "dictionary.json";

export const getDictionaryFilePath = (sliceId: string) => {
  return path.resolve(
    getGeocodeDictionariesDirPath(),
    sliceId,
    getGeocodeDictionaryFileName(),
  );
};

const createStandardizedSlice = (
  semanticPart: AddressNodeWithSemanticPart,
): string | undefined => {
  return printStandardizedAddressSection(
    semanticPart,
    (words) => words,
    (word) => word.value,
  );
};

/**
 *
 * for cleaned address (CAPS):
 *   first letters of words that are not designations
 *   e.g. "село проверочное 1234, улица тестовая" → "cleaned", п-т
 *
 * for standardised address (lower case):
 *   "standardized", federal subject, settlement, street
 *
 * TODO: support villages
 *   federal subject, +district?, settlement, street
 */
export const deriveNormalizedAddressSliceId = (
  normalizedAddress: string,
  addressNormalizationConfig: AddressNormalizationConfig,
): string => {
  const slices: Array<string | undefined> = [];
  const cleanedAddressAst = buildCleanedAddressAst(
    normalizedAddress,
    addressNormalizationConfig,
  );

  try {
    const standardizedAddressAst = buildStandardizedAddressAst(
      cleanedAddressAst,
      addressNormalizationConfig,
    );

    if (standardizedAddressAst.streets.length > 1) {
      throw new AddressInterpretationError(
        `Unexpected more than one street in "${normalizedAddress}"`,
      );
    }
    if (standardizedAddressAst.houses.length > 1) {
      throw new AddressInterpretationError(
        `Unexpected more than one house "${normalizedAddress}"`,
      );
    }

    slices.push("standardized");
    slices.push(createStandardizedSlice(standardizedAddressAst.region));
    slices.push(createStandardizedSlice(standardizedAddressAst.settlement));
    slices.push(createStandardizedSlice(standardizedAddressAst.streets[0]));
  } catch (e: unknown) {
    if (!(e instanceof AddressInterpretationError)) {
      throw e;
    }
    slices.push("cleaned");
    const firstLetters: string[] = [];
    cleanedAddressAst.children.forEach((node) => {
      if (
        node.nodeType === "word" &&
        node.wordType === "unclassified" &&
        node.value[0] !== undefined &&
        node.value[1] !== undefined
      ) {
        firstLetters.push(node.value[0]);
      }
    });

    slices.push(firstLetters.length ? firstLetters.slice(0, 3).join("-") : "-");
  }

  return slices
    .filter((slice): slice is string => typeof slice === "string")
    .map((slice) => slice.replace(/\//g, ""))
    .join("/");
};

export const ensureTerritoryGitignoreContainsGeocoding = async (): Promise<void> => {
  await ensureTerritoryGitignoreContainsLine("/geocoding");
};
