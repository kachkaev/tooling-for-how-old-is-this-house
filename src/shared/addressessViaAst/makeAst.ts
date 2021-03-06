import {
  AddressAst,
  AddressNodeWithSegment,
  AddressTokenOrProtoWord,
} from "./types";

export const makeAst = (
  tokensWithProtoWords: AddressTokenOrProtoWord[],
): AddressAst => {
  const segments: AddressNodeWithSegment[] = tokensWithProtoWords.length
    ? []
    : [];

  return {
    segments,
  };
};
