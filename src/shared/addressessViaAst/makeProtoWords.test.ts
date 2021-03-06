import { makeProtoWords } from "./makeProtoWords";
import { makeTokens } from "./makeTokens";
import { testCases } from "./testHelpers/testCases";

describe("makeProtoWords", () => {
  testCases.forEach(({ rawAddress, expectedTokensWithProtoWords }) => {
    if (expectedTokensWithProtoWords) {
      it(`works for "${rawAddress}"`, () => {
        expect(makeProtoWords(makeTokens(rawAddress))).toEqual(
          expectedTokensWithProtoWords,
        );
      });
    }
  });
});
