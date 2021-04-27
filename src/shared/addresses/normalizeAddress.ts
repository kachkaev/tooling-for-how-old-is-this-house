import { AddressInterpretationError } from "./AddressInterpretationError";
import { buildCleanedAddressAst } from "./buildCleanedAddressAst";
import { buildStandardizedAddressAst } from "./buildStandardizedAddressAst";
import { printCleanedAddressAst } from "./printCleanedAddressAst";
import { printStandardizedAddressAst } from "./printStandardizedAddressAst";

export const normalizeAddress = (
  rawAddress: string | undefined,
): string | undefined => {
  if (!rawAddress || rawAddress.trim().length === 0) {
    return undefined;
  }

  const cleanedAddressAst = buildCleanedAddressAst(rawAddress);

  // Check for empty addresses (only separators, e.g. "-")
  if (!cleanedAddressAst.children.some((node) => node.nodeType === "word")) {
    return undefined;
  }

  try {
    const standardizedAddressAst = buildStandardizedAddressAst(
      cleanedAddressAst,
    );

    return printStandardizedAddressAst(standardizedAddressAst);
  } catch (e: unknown) {
    if (e instanceof AddressInterpretationError) {
      return printCleanedAddressAst(cleanedAddressAst);
    }
    throw e;
  }
};
