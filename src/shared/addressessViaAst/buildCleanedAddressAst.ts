import { extractTokens } from "./extractTokens";
import {
  AddressNodeWithWord,
  AddressToken,
  AddressTokenType,
  CleanedAddressAst,
  CleanedAddressNode,
} from "./types";

const tokensToConvertToWords = new Set<AddressTokenType>([
  "letterSequence",
  "numberSequence",
  "protoWord",
]);

const punctuationTokensToKeep = new Set<AddressTokenType>([
  "bracket",
  "comma",
  "dash",
  "slash",
]);

export const buildCleanedAddressAst = (
  rawAddress: string,
): CleanedAddressAst => {
  const tokens = extractTokens(rawAddress);
  const filteredTokens = tokens.filter(
    ([type]) =>
      tokensToConvertToWords.has(type) || punctuationTokensToKeep.has(type),
  );

  const wordsAndPunctuations: Array<
    AddressNodeWithWord | AddressToken
  > = filteredTokens;

  const children: CleanedAddressNode[] = wordsAndPunctuations.length ? [] : [];

  return {
    nodeType: "cleanedAddress",
    children,
  };
};
