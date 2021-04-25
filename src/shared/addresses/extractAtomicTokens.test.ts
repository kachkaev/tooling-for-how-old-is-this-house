import { extractAtomicTokens } from "./extractAtomicTokens";
import { testCases } from "./testHelpers/testCases";

describe("extractAtomicTokens", () => {
  testCases.forEach(({ rawAddresses, expectedAtomicTokens }) => {
    if (expectedAtomicTokens) {
      for (const rawAddress of rawAddresses) {
        it(`works for "${rawAddress}"`, () => {
          expect(extractAtomicTokens(rawAddress)).toEqual(expectedAtomicTokens);
        });
      }
    }
  });
});
