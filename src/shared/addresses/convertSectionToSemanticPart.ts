import _ from "lodash";

import { AddressInterpretationError } from "./AddressInterpretationError";
import { commonUnclassifiedWordConfigLookup } from "./helpersForCommonUnclassifiedWords";
import { getDesignationConfig } from "./helpersForDesignations";
import {
  AddressNodeWithDesignation,
  AddressNodeWithSemanticPart,
  AddressSection,
} from "./types";

export const convertSectionToSemanticPart = (
  addressSection: AddressSection,
): AddressNodeWithSemanticPart => {
  const designationWord = addressSection.words.find(
    (word): word is AddressNodeWithDesignation =>
      word.wordType === "designation",
  );
  const designationConfig =
    designationWord && getDesignationConfig(designationWord);

  const filteredWords = addressSection.words.filter((word) => {
    // Ignore initials
    if (word.wordType === "initial") {
      return false;
    }
    // Handle common unclassified words
    if (word.wordType === "unclassified") {
      const commonUnclassifiedWordConfig =
        commonUnclassifiedWordConfigLookup[word.value];

      // Stop if canBeInStandardizedAddress
      if (commonUnclassifiedWordConfig) {
        if (commonUnclassifiedWordConfig.canBeInStandardizedAddress === false) {
          throw new AddressInterpretationError(
            `Encountered a word that can’t be in standardized address: ${word.value}`,
          );
        }

        // Ignore common unclassified words if applicable
        if (
          commonUnclassifiedWordConfig.ignored === true ||
          (designationConfig &&
            commonUnclassifiedWordConfig.ignored?.includes(
              designationConfig?.designation,
            ))
        ) {
          return false;
        }
      }
    }

    return true;
  });

  const orderedWords = _.orderBy(filteredWords, [
    (word) =>
      word.wordType === "designation"
        ? 0
        : word.wordType === "ordinalNumber" ||
          word.wordType === "designationAdjective"
        ? 2
        : 1,
    (word, index) => index,
  ]);

  // Remove settlement designation (город пенза → пенза)
  const firstWord = orderedWords[0];
  if (firstWord?.wordType === "designation") {
    if (designationConfig?.designation === "settlement") {
      orderedWords.shift();
    }
  }

  return {
    nodeType: "semanticPart",
    orderedWords,
  };
};
