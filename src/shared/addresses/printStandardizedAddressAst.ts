import { orderedSectionTypes } from "./helpersForStandardization";
import { printStandardizedAddressSection } from "./printStandardizedAddressSection";
import { StandardizedAddressAst } from "./types";

export const printStandardizedAddressAst = (
  standardizedAddressAst: StandardizedAddressAst,
): string => {
  const printedSections: string[] = [];
  for (const sectionType of orderedSectionTypes) {
    printedSections.push(
      printStandardizedAddressSection(
        standardizedAddressAst.semanticPartLookup[sectionType],
      ),
    );
  }

  return printedSections.join(", ");
};
