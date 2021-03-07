import { extractAtomicTokens } from "./extractAtomicTokens";
import { testCases } from "./testHelpers/testCases";

describe("extractAtomicTokens", () => {
  testCases.forEach(({ rawAddress, expectedAtomicTokens }) => {
    if (expectedAtomicTokens) {
      it(`works for "${rawAddress}"`, () => {
        expect(extractAtomicTokens(rawAddress)).toEqual(expectedAtomicTokens);
      });
    }
  });
});
