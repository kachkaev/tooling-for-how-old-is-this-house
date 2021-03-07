import { extractTokens } from "./extractTokens";
import { testCases } from "./testHelpers/testCases";

describe("extractTokens", () => {
  testCases.forEach(({ rawAddress, expectedTokens }) => {
    if (expectedTokens) {
      it(`works for "${rawAddress}"`, () => {
        expect(extractTokens(rawAddress)).toEqual(expectedTokens);
      });
    }
  });
});
