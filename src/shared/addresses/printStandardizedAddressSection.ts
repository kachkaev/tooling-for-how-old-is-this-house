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
  return postProcessWordsInStandardizedAddressSection(astNode.orderedWords)
    .map((wordNode) => finalizeWordSpelling(wordNode))
    .join(" ");
};
