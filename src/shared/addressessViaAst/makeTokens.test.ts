import { makeTokens } from "./makeTokens";
import { testCases } from "./testHelpers/testCases";

describe("makeTokens", () => {
  testCases.forEach(({ rawAddress, expectedTokens }) => {
    if (expectedTokens) {
      it(`works for "${rawAddress}"`, () => {
        expect(makeTokens(rawAddress)).toEqual(expectedTokens);
      });
    }
  });
});
