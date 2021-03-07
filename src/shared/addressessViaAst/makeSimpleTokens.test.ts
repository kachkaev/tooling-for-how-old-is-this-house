import { makeSimpleTokens } from "./makeSimpleTokens";
import { testCases } from "./testHelpers/testCases";

describe("makeSimpleTokens", () => {
  testCases.forEach(({ rawAddress, expectedTokens }) => {
    if (expectedTokens) {
      it(`works for "${rawAddress}"`, () => {
        expect(makeSimpleTokens(rawAddress)).toEqual(expectedTokens);
      });
    }
  });
});
