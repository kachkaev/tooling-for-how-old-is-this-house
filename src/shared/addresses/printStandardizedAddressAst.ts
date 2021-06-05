import { printStandardizedAddressSection } from "./printStandardizedAddressSection";
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

  printableParts.push(standardizedAddressAst.region);
  printableParts.push(", ", standardizedAddressAst.settlement);

  standardizedAddressAst.streets.forEach((semanticPart, index) => {
    printableParts.push(index === 0 ? ", " : " / ", semanticPart);
  });
  standardizedAddressAst.houses.forEach((semanticPart, index) => {
    printableParts.push(index === 0 ? ", " : "/", semanticPart);
  });
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
