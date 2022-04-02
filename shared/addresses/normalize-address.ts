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
} from "./types";

export const normalizeAddress = (
  rawAddress: string | undefined,
  config: AddressNormalizationConfig,
  postProcessWordsInStandardizedAddressSection?: PostProcessWordsInStandardizedAddressSection,
  finalizeWordSpelling?: FinalizeWordSpelling,
): string | undefined => {
  if (!rawAddress || rawAddress.trim().length === 0) {
    return undefined;
  }

  const cleanedAddressAst = buildCleanedAddressAst(rawAddress, config);

  if (checkIfCleanedAddressAstIsEmpty(cleanedAddressAst)) {
    return undefined;
  }

  try {
    const standardizedAddressAst = buildStandardizedAddressAst(
      cleanedAddressAst,
      config,
    );

    return printStandardizedAddressAst(
      standardizedAddressAst,
      postProcessWordsInStandardizedAddressSection,
      finalizeWordSpelling,
    );
  } catch (error) {
    if (error instanceof AddressInterpretationError) {
      return printCleanedAddressAst(cleanedAddressAst, finalizeWordSpelling);
    }
    throw error;
  }
};
