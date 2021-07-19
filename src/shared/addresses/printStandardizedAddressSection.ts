import {
  AddressNodeWithSemanticPart,
  FinalizeWordSpelling,
  PostProcessWordsInStandardizedAddressSection,
} from "./types";

export const printStandardizedAddressSection = (
  astNode: AddressNodeWithSemanticPart,
  postProcessWordsInStandardizedAddressSection: PostProcessWordsInStandardizedAddressSection,
  finalizeWordSpelling: FinalizeWordSpelling,
): string => {
  const postProcessedWords = postProcessWordsInStandardizedAddressSection(
    astNode.orderedWords,
  );

  return postProcessedWords
    .map((wordNode) => finalizeWordSpelling(wordNode, postProcessedWords))
    .join(" ");
};
