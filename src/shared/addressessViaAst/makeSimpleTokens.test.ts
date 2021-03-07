import { makeSimpleTokens } from "./makeSimpleTokens";
import { testCases } from "./testHelpers/testCases";

describe("makeSimpleTokens", () => {
  testCases.forEach(({ rawAddress, expectedSimpleTokens }) => {
    if (expectedSimpleTokens) {
      it(`works for "${rawAddress}"`, () => {
        expect(makeSimpleTokens(rawAddress)).toEqual(expectedSimpleTokens);
      });
    }
  });
});
