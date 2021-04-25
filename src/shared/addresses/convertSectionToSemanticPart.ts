import _ from "lodash";

import { getDesignationConfig } from "./helpersForDesignations";
import { AddressNodeWithSection, AddressNodeWithSemanticPart } from "./types";

export const convertSectionToSemanticPart = (
  addressSection: AddressNodeWithSection,
): AddressNodeWithSemanticPart => {
  const orderedWords = _.orderBy(addressSection.words, [
    (word) =>
      word.wordType === "designation"
        ? 0
        : word.wordType === "ordinalNumber" ||
          word.wordType === "cardinalNumber" ||
          word.wordType === "designationAdjective"
        ? 2
        : 1,
    (word) => word.value,
  ]);

  const firstWord = orderedWords[0];
  if (firstWord.wordType === "designation") {
    const designationConfig = getDesignationConfig(firstWord);
    if (designationConfig.designation === "settlement") {
      orderedWords.shift();
    }
  }

  return {
    nodeType: "semanticPart",
    orderedWords,
  };
};
