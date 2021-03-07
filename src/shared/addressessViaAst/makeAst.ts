import { AddressAst, AddressNodeWithSegment, AddressToken } from "./types";

export const makeAst = (tokensWithProtoWords: AddressToken[]): AddressAst => {
  const segments: AddressNodeWithSegment[] = tokensWithProtoWords.length
    ? []
    : [];

  return {
    segments,
  };
};
