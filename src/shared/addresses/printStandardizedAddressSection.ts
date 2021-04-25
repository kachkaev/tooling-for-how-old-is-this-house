import { AddressNodeWithSemanticPart } from "./types";

export const printStandardizedAddressSection = (
  astNode: AddressNodeWithSemanticPart,
): string => {
  return astNode.orderedWords.map((wordNode) => wordNode.value).join(" ");
};
