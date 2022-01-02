import _ from "lodash";

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

  // Ignore common unclassified words if applicable
  const filteredWords = addressSection.words.filter((word) => {
    if (word.wordType === "unclassified") {
      const commonUnclassifiedWordConfig =
        commonUnclassifiedWordConfigLookup[word.value];

      if (
        commonUnclassifiedWordConfig &&
        (commonUnclassifiedWordConfig.ignored === true ||
          (designationConfig &&
            commonUnclassifiedWordConfig.ignored?.includes(
              designationConfig.designation,
            )))
      ) {
        return false;
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
  if (
    firstWord?.wordType === "designation" &&
    designationConfig?.designation === "settlement"
  ) {
    orderedWords.shift();
  }

  return {
    nodeType: "semanticPart",
    orderedWords,
  };
};
