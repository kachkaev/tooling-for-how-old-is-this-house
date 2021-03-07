import { StandardizedAddressAst } from "./types";

export const printStandardizedAddressAst = (
  standardizedAddressAst: StandardizedAddressAst,
): string => {
  return `${standardizedAddressAst.segments.length}`;
};
