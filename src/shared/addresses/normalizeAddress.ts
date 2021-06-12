import { AddressInterpretationError } from "./AddressInterpretationError";
import { buildCleanedAddressAst } from "./buildCleanedAddressAst";
import { buildStandardizedAddressAst } from "./buildStandardizedAddressAst";
import { checkIfCleanedAddressAstIsEmpty } from "./helpersForNormalization";
import { printCleanedAddressAst } from "./printCleanedAddressAst";
import { printStandardizedAddressAst } from "./printStandardizedAddressAst";
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
  } catch (e: unknown) {
    if (e instanceof AddressInterpretationError) {
      return printCleanedAddressAst(cleanedAddressAst, finalizeWordSpelling);
    }
    throw e;
  }
};
