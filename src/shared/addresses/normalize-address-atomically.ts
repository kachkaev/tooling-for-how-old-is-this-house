import { AddressInterpretationError } from "./address-interpretation-error";
import { buildCleanedAddressAst } from "./build-cleaned-address-ast";
import { buildStandardizedAddressAst } from "./build-standardized-address-ast";
import { checkIfCleanedAddressAstIsEmpty } from "./helpers-for-normalization";
import { printCleanedAddressAst } from "./print-cleaned-address-ast";
import { printStandardizedAddressAst } from "./print-standardized-address-ast";
import {
  AddressNormalizationConfig,
  FinalizeWordSpelling,
  PostProcessWordsInStandardizedAddressSection,
  StandardizedAddressAst,
} from "./types";

const atomizeStandardizedAddressAst = (
  standardizedAddressAst: StandardizedAddressAst,
): StandardizedAddressAst[] => {
  const result: StandardizedAddressAst[] = [];
  for (
    let index = 0;
    index < standardizedAddressAst.streets.length;
    index += 1
  ) {
    const street = standardizedAddressAst.streets[index];
    if (!street) {
      throw new Error(`Unexpected empty street at index ${index}`);
    }
    const house =
      standardizedAddressAst.houses[index] ?? standardizedAddressAst.houses[0];

    result.push({
      nodeType: "standardizedAddress",
      region: standardizedAddressAst.region,
      settlement: standardizedAddressAst.settlement,
      streets: [street],
      houses: [house],
      housePart: standardizedAddressAst.housePart,
    });
  }

  return result;
};

export const normalizeAddressAtomically = (
  rawAddress: string | undefined,
  config: AddressNormalizationConfig,
  postProcessWordsInStandardizedAddressSection?: PostProcessWordsInStandardizedAddressSection,
  finalizeWordSpelling?: FinalizeWordSpelling,
): string[] => {
  if (!rawAddress || rawAddress.trim().length === 0) {
    return [];
  }

  const cleanedAddressAst = buildCleanedAddressAst(rawAddress, config);

  if (checkIfCleanedAddressAstIsEmpty(cleanedAddressAst)) {
    return [];
  }

  try {
    const standardizedAddressAst = buildStandardizedAddressAst(
      cleanedAddressAst,
      config,
    );

    const standardizedAddressAsts = atomizeStandardizedAddressAst(
      standardizedAddressAst,
    );

    return standardizedAddressAsts.map((atomicStandardizedAddressAst) =>
      printStandardizedAddressAst(
        atomicStandardizedAddressAst,
        postProcessWordsInStandardizedAddressSection,
        finalizeWordSpelling,
      ),
    );
  } catch (error) {
    if (error instanceof AddressInterpretationError) {
      return [printCleanedAddressAst(cleanedAddressAst, finalizeWordSpelling)];
    }
    throw error;
  }
};
