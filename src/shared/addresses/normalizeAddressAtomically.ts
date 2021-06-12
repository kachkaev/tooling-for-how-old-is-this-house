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
  } catch (e: unknown) {
    if (e instanceof AddressInterpretationError) {
      return [printCleanedAddressAst(cleanedAddressAst, finalizeWordSpelling)];
    }
    throw e;
  }
};
