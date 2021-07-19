import _ from "lodash";

import { extractAtomicTokens } from "./extractAtomicTokens";
import { commonUnclassifiedWordConfigs } from "./helpersForCommonUnclassifiedWords";
import {
  designationConfigs,
  getDesignationConfig,
} from "./helpersForDesignations";
import { ordinalNumberEndingConfigLookup } from "./helpersForOrdinalNumbers";
import { regionConfigs } from "./helpersForRegions";
import { simplifySpelling } from "./helpersForWords";
import { normalizeAddress } from "./normalizeAddress";
import {
  AddressBeautificationConfig,
  AddressNodeWithDesignation,
  AddressNodeWithNumber,
  AddressNodeWithWord,
  FinalizeWordSpelling,
  PostProcessWordsInStandardizedAddressSection,
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

const postProcessWordsInStandardizedAddressSection: PostProcessWordsInStandardizedAddressSection = (
  words,
) => {
  const designationWord = words.find(
    (word): word is AddressNodeWithDesignation =>
      word.wordType === "designation",
  );

  const designationConfig = designationWord
    ? getDesignationConfig(designationWord)
    : undefined;
  if (
    designationConfig &&
    (designationConfig.designation === "house" ||
      designationConfig.designation === "housePart")
  ) {
    return words;
  }

  const designationLikeWord = words.find((word) => {
    if (word.wordType !== "unclassified") {
      return false;
    }
    try {
      return getDesignationConfig({ ...word, wordType: "designation" })
        .canBePartOfName;
    } catch {
      // noop
    }

    return false;
  });

  const adjectiveLikeOrdering =
    !designationLikeWord &&
    !designationConfig?.alwaysGoesBeforeName &&
    words.every(
      ({ value, wordType }) =>
        wordType !== "unclassified" ||
        value.endsWith("ья") ||
        value.endsWith("ая") ||
        (value.endsWith("ой") && !value.endsWith("ской")) || // "Кривой переулок" vs "переулок Космодемьянской"
        value.endsWith("ий") ||
        value.endsWith("ый") ||
        value.endsWith("ое") ||
        value.endsWith("ее") ||
        value.endsWith("ье"),
    );

  const result = _.orderBy(
    words,
    adjectiveLikeOrdering ? orderForAdjectiveLikeName : orderForStandardName,
  );

  const wordWithOrdinalNumber = result.find(
    (word): word is AddressNodeWithNumber => word.wordType === "ordinalNumber",
  );

  const genderMismatch =
    wordWithOrdinalNumber &&
    designationConfig &&
    ordinalNumberEndingConfigLookup[wordWithOrdinalNumber.ending]?.gender !==
      designationConfig.gender;

  // Special case:
  // "улица 2-я Набережная"
  // "улица 3-й Зелёный овраг"
  // "улица 42-й дивизии"
  if (wordWithOrdinalNumber && (designationLikeWord || genderMismatch)) {
    result.splice(result.indexOf(wordWithOrdinalNumber), 1);
    result.splice(1, 0, wordWithOrdinalNumber);
  }

  return result;
};

type LetterCasing = "allUpper" | "allLower" | "firstUpper";

const deriveLetterCasing = (
  letterSequence: string,
): LetterCasing | undefined => {
  const letterSequenceWithoutLeadingDash =
    letterSequence[0] === "-" ? letterSequence.slice(1) : letterSequence;
  if (
    letterSequenceWithoutLeadingDash.toLowerCase() ===
    letterSequenceWithoutLeadingDash
  ) {
    return "allLower";
  }
  if (
    letterSequenceWithoutLeadingDash.toUpperCase() ===
    letterSequenceWithoutLeadingDash
  ) {
    return "allUpper";
  }
  if (
    _.capitalize(letterSequenceWithoutLeadingDash) ===
    letterSequenceWithoutLeadingDash
  ) {
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
  addressBeautificationConfig: AddressBeautificationConfig,
): ((rawAddress: string | undefined) => string | undefined) => {
  const letterCasingLookup: Record<string, LetterCasing> = {};
  const spellingLookup: Record<string, string> = {};

  const allKnownAddresses = [...knownAddresses];
  for (const regionConfig of regionConfigs) {
    allKnownAddresses.push(regionConfig.canonicalName);
  }

  for (const knownAddress of allKnownAddresses) {
    const addressTokens = extractAtomicTokens(knownAddress);

    // Letter sequences are prefixed with "-" if this token precedes. This helps format complex words like "Салтыкова-Щедрина", "Ново-гражданская"
    const letterSequences: string[] = [];
    for (let index = 0; index < addressTokens.length; index += 1) {
      const token = addressTokens[index];
      const prevToken = addressTokens[index - 1];
      if (token?.[0] !== "letterSequence" || token?.[1].length < 2) {
        continue;
      }
      if (prevToken?.[1] === "-") {
        letterSequences.push(`-${token[1]}`);
      } else {
        letterSequences.push(token[1]);
      }
    }

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
    spellingLookup[simplifySpelling(normalizedValue)] =
      beautifiedValue ?? normalizedValue;
  }
  for (const {
    normalizedValue,
    beautifiedValue,
  } of commonUnclassifiedWordConfigs) {
    spellingLookup[simplifySpelling(normalizedValue)] =
      beautifiedValue ?? normalizedValue;
  }

  if (addressBeautificationConfig.canonicalSpellings instanceof Array) {
    for (const canonicalSpelling of addressBeautificationConfig.canonicalSpellings) {
      if (typeof canonicalSpelling === "string") {
        spellingLookup[simplifySpelling(canonicalSpelling)] = canonicalSpelling;
      }
    }
  }

  const finalizeWordSpelling: FinalizeWordSpelling = (
    word,
    neighbouringWords,
  ) => {
    const { value, wordType } = word;

    // "42а" → "42А", "а." → "А.", "а" → "А"
    if (
      wordType === "cardinalNumber" ||
      wordType === "initial" ||
      (wordType === "unclassified" && value.length === 1)
    ) {
      return value.toUpperCase();
    }

    if (wordType === "designationAdjective") {
      return _.capitalize(value);
    }

    // "Салтыкова-Щедрина"
    if (wordType === "unclassified") {
      // улица набережная → улица Набережная
      // улица зелёный овраг → улица Зелёный овраг
      try {
        if (
          getDesignationConfig({ ...word, wordType: "designation" })
            .canBePartOfName
        ) {
          const isLastWord =
            neighbouringWords.indexOf(word) === neighbouringWords.length - 1;
          const prevWordType =
            neighbouringWords[neighbouringWords.length - 2]?.wordType;
          if (
            !isLastWord ||
            prevWordType === "designation" ||
            prevWordType === "ordinalNumber"
          ) {
            return _.capitalize(value);
          }
        }
      } catch {
        // noop
      }

      return value
        .split(/(?=-)/g) // https://stackoverflow.com/a/25221523/1818285
        .map((valueChunk) => spellingLookup[valueChunk] ?? valueChunk)
        .join("");
    }

    return spellingLookup[value] ?? value;
  };

  return (address: string | undefined) =>
    normalizeAddress(
      address,
      addressBeautificationConfig,
      postProcessWordsInStandardizedAddressSection,
      finalizeWordSpelling,
    );
};
