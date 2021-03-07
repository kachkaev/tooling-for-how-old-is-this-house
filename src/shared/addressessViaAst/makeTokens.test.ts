import { makeSimpleTokens } from "./makeSimpleTokens";
import { makeTokens } from "./makeTokens";
import { testCases } from "./testHelpers/testCases";

describe("makeTokens", () => {
  testCases.forEach(
    ({ rawAddress, expectedTokens: expectedTokensWithProtoWords }) => {
      if (expectedTokensWithProtoWords) {
        it(`works for "${rawAddress}"`, () => {
          expect(makeTokens(makeSimpleTokens(rawAddress))).toEqual(
            expectedTokensWithProtoWords,
          );
        });
      }
    },
  );
});
