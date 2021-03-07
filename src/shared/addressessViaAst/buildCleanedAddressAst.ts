import { makeTokens } from "./makeTokens";
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
  const tokens = makeTokens(rawAddress);
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
