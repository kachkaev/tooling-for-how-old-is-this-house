import { printStandardizedAddressSection } from "./print-standardized-address-section";
import {
  AddressNodeWithSemanticPart,
  FinalizeWordSpelling,
  PostProcessWordsInStandardizedAddressSection,
  StandardizedAddressAst,
} from "./types";

export const printStandardizedAddressAst = (
  standardizedAddressAst: StandardizedAddressAst,
  postProcessWordsInStandardizedAddressSection: PostProcessWordsInStandardizedAddressSection = (
    words,
  ) => words,
  finalizeWordSpelling: FinalizeWordSpelling = (word) => word.value,
): string => {
  const printableParts: Array<string | AddressNodeWithSemanticPart> = [];

  printableParts.push(
    standardizedAddressAst.region,
    ", ",
    standardizedAddressAst.settlement,
  );

  for (const [
    index,
    semanticPart,
  ] of standardizedAddressAst.streets.entries()) {
    printableParts.push(index === 0 ? ", " : " / ", semanticPart);
  }
  for (const [index, semanticPart] of standardizedAddressAst.houses.entries()) {
    printableParts.push(index === 0 ? ", " : "/", semanticPart);
  }
  if (standardizedAddressAst.housePart) {
    printableParts.push(" ", standardizedAddressAst.housePart);
  }

  return printableParts
    .map((part) =>
      typeof part === "string"
        ? part
        : printStandardizedAddressSection(
            part,
            postProcessWordsInStandardizedAddressSection,
            finalizeWordSpelling,
          ),
    )
    .join("");
};
