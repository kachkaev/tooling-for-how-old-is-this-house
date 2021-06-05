import {
  AddressNodeWithSemanticPart,
  FinalizeWordSpelling,
  ReorderWordsInSection,
} from "./types";

export const printStandardizedAddressSection = (
  astNode: AddressNodeWithSemanticPart,
  reorderWordsInSection: ReorderWordsInSection,
  finalizeWordSpelling: FinalizeWordSpelling,
): string => {
  return reorderWordsInSection(astNode.orderedWords)
    .map((wordNode) => finalizeWordSpelling(wordNode))
    .join(" ");
};
