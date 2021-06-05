import { orderedSectionTypes } from "./helpersForStandardization";
import { printStandardizedAddressSection } from "./printStandardizedAddressSection";
import {
  FinalizeWordSpelling,
  ReorderWordsInSection,
  StandardizedAddressAst,
} from "./types";

export const printStandardizedAddressAst = (
  standardizedAddressAst: StandardizedAddressAst,
  reorderWordsInSection: ReorderWordsInSection = (words) => words,
  finalizeWordSpelling: FinalizeWordSpelling = (word) => word.value,
): string => {
  const printedSections: string[] = [];
  for (const sectionType of orderedSectionTypes) {
    printedSections.push(
      printStandardizedAddressSection(
        standardizedAddressAst.semanticPartLookup[sectionType],
        reorderWordsInSection,
        finalizeWordSpelling,
      ),
    );
  }

  return printedSections.join(", ");
};
