import { printStandardizedAddressSection } from "./printStandardizedAddressSection";
import {
  StandardizedAddressAst,
  StandardizedAddressAstSectionType,
} from "./types";

const orderedSectionTypes: StandardizedAddressAstSectionType[] = [
  "region",
  "settlement",
  "streetOrPlace",
  "building",
];

export const printStandardizedAddressAst = (
  standardizedAddressAst: StandardizedAddressAst,
): string => {
  const printedSections: string[] = [];
  for (const sectionType of orderedSectionTypes) {
    printedSections.push(
      printStandardizedAddressSection(
        standardizedAddressAst.sectionLookup[sectionType],
      ),
    );
  }

  return printedSections.join(", ");
};
