import { CleanedAddressAst } from "./types";

export const checkIfCleanedAddressAstIsEmpty = (
  cleanedAddressAst: CleanedAddressAst,
) => !cleanedAddressAst.children.some((node) => node.nodeType === "word");
