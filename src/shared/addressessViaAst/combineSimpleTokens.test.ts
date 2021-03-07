import { mergeSimpleTokens } from "./combineSimpleTokens";
import { makeSimpleTokens } from "./makeSimpleTokens";
import { testCases } from "./testHelpers/testCases";

describe("mergeSimpleTokens", () => {
  testCases.forEach(
    ({ rawAddress, expectedTokens: expectedTokensWithProtoWords }) => {
      if (expectedTokensWithProtoWords) {
        it(`works for "${rawAddress}"`, () => {
          expect(mergeSimpleTokens(makeSimpleTokens(rawAddress))).toEqual(
            expectedTokensWithProtoWords,
          );
        });
      }
    },
  );
});
