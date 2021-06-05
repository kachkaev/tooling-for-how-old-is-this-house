import _ from "lodash";

import { extractAtomicTokens } from "./extractAtomicTokens";
import {
  designationConfigs,
  getDesignationConfig,
} from "./helpersForDesignations";
import { simplifySpelling } from "./helpersForWords";
import { normalizeAddress } from "./normalizeAddress";
import {
  AddressNodeWithWord,
  AddressNormalizationConfig,
  FinalizeWordSpelling,
  ReorderWordsInSection,
} from "./types";

const orderForStandardName = ({ wordType }: AddressNodeWithWord): number => {
  switch (wordType) {
    case "ordinalNumber":
      return 0;
    case "designation":
      return 1;
    case "designationAdjective":
      return 2;
    default:
      return 3;
  }
};

const orderForAdjectiveLikeName = ({
  wordType,
}: AddressNodeWithWord): number => {
  switch (wordType) {
    case "ordinalNumber":
      return 0;
    case "designation":
      return 3;
    case "designationAdjective":
      return 1;
    default:
      return 2;
  }
};

const reorderWordsInSection: ReorderWordsInSection = (words) => {
  let designationGoesBeforeName = false;
  for (const word of words) {
    if (word.wordType === "designation") {
      const designationConfig = getDesignationConfig(word);
      if (
        designationConfig.designation === "house" ||
        designationConfig.designation === "housePart"
      ) {
        return words;
      }
      if (designationConfig.alwaysGoesBeforeName) {
        designationGoesBeforeName = true;
        break;
      }
    }
  }

  const adjectiveLikeOrdering =
    !designationGoesBeforeName &&
    words.some(
      ({ value, wordType }) =>
        wordType === "unclassified" &&
        (value.endsWith("ья") ||
          value.endsWith("ая") ||
          value.endsWith("ой") ||
          value.endsWith("ий") ||
          value.endsWith("ый") ||
          value.endsWith("ое") ||
          value.endsWith("ее") ||
          value.endsWith("ье")),
    );

  return _.orderBy(
    words,
    adjectiveLikeOrdering ? orderForAdjectiveLikeName : orderForStandardName,
  );
};

type LetterCasing = "allUpper" | "allLower" | "firstUpper";

const deriveLetterCasing = (
  letterSequence: string,
): LetterCasing | undefined => {
  if (letterSequence.toLowerCase() === letterSequence) {
    return "allLower";
  }
  if (letterSequence.toUpperCase() === letterSequence) {
    return "allUpper";
  }
  if (_.capitalize(letterSequence) === letterSequence) {
    return "firstUpper";
  }

  return undefined;
};

const checkIfFirstLetterCasingIsWorse = (
  letterCasing1: LetterCasing,
  letterCasing2: LetterCasing,
): boolean => {
  if (letterCasing1 === letterCasing2) {
    return false;
  }
  if (letterCasing1 === "firstUpper") {
    return false;
  }

  if (letterCasing1 === "allUpper" && letterCasing2 === "allLower") {
    return false;
  }

  return true;
};

const checkIfsimplifySpellingDistortsCharacters = (letterSequence: string) => {
  return simplifySpelling(letterSequence) !== letterSequence.toLowerCase();
};
export const createBeautifyAddress = (
  knownAddresses: readonly string[],
  addressNormalizationConfig: AddressNormalizationConfig,
): ((rawAddress: string | undefined) => string | undefined) => {
  const letterCasingLookup: Record<string, LetterCasing> = {};
  const spellingLookup: Record<string, string> = {};

  for (const knownAddress of knownAddresses) {
    const addressTokens = extractAtomicTokens(knownAddress);
    const letterSequences = addressTokens
      .filter(
        ([tokenType, tokenValue]) =>
          tokenType === "letterSequence" && tokenValue.length > 1,
      )
      .map(([, tokenValue]) => tokenValue);

    const numberOfUpperCaseLetterSequences = letterSequences.filter(
      (value) => value.toUpperCase() === value,
    ).length;

    // Discard address if most letter sequences are upper case
    if (numberOfUpperCaseLetterSequences * 2 >= letterSequences.length) {
      continue;
    }

    letterSequences.forEach((letterSequence) => {
      const simplifiedSpelling = simplifySpelling(letterSequence);
      if (simplifiedSpelling !== letterSequence) {
        const letterCasing = deriveLetterCasing(letterSequence);
        const oldLetterSequence = letterCasingLookup[simplifiedSpelling];
        const oldLetterCasing = letterCasingLookup[simplifiedSpelling];

        const canOverrideLetterCasing =
          letterCasing &&
          (!oldLetterCasing ||
            !checkIfFirstLetterCasingIsWorse(letterCasing, oldLetterCasing));

        const bringsNewCharacters =
          !oldLetterSequence ||
          (checkIfsimplifySpellingDistortsCharacters(oldLetterSequence) &&
            !checkIfsimplifySpellingDistortsCharacters(letterSequence));

        if (letterCasing && (canOverrideLetterCasing || bringsNewCharacters)) {
          spellingLookup[simplifiedSpelling] = letterSequence;
          letterCasingLookup[simplifiedSpelling] = letterCasing;
        }
      }
    });
  }

  for (const { normalizedValue, beautifiedValue } of designationConfigs) {
    if (beautifiedValue) {
      spellingLookup[simplifySpelling(beautifiedValue)] = beautifiedValue;
    } else {
      spellingLookup[simplifySpelling(normalizedValue)] = normalizedValue;
    }
  }

  if (addressNormalizationConfig.canonicalSpellings instanceof Array) {
    for (const canonicalSpelling of addressNormalizationConfig.canonicalSpellings) {
      if (typeof canonicalSpelling === "string") {
        spellingLookup[simplifySpelling(canonicalSpelling)] = canonicalSpelling;
      }
    }
  }

  const finalizeWordSpelling: FinalizeWordSpelling = ({ value, wordType }) => {
    // "42а" → "42А", "а." → "А."
    if (wordType === "cardinalNumber" || wordType === "initial") {
      return value.toUpperCase();
    }

    if (wordType === "designationAdjective") {
      return _.capitalize(value);
    }

    // "Салтыкова-Щедрина"
    if (wordType === "unclassified") {
      return value
        .split("-")
        .map((valueChunk) => spellingLookup[valueChunk] ?? valueChunk)
        .join("-");
    }

    return spellingLookup[value] ?? value;
  };

  return (address: string | undefined) =>
    normalizeAddress(
      address,
      addressNormalizationConfig,
      reorderWordsInSection,
      finalizeWordSpelling,
    );
};
