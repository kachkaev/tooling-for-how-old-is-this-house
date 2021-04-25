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
  try {
    const standardizedAddressAst = buildStandardizedAddressAst(
      cleanedAddressAst,
    );

    return printStandardizedAddressAst(standardizedAddressAst);
  } catch {
    return printCleanedAddressAst(cleanedAddressAst);
  }
};
