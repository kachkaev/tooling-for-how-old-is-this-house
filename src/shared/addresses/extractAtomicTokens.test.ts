import { extractAtomicTokens } from "./extractAtomicTokens";
import { testCases } from "./testHelpers/testCases";

describe("extractAtomicTokens", () => {
  for (const { rawAddresses, expectedAtomicTokens } of testCases) {
    if (expectedAtomicTokens) {
      for (const rawAddress of rawAddresses) {
        it(`works for "${rawAddress}"`, () => {
          expect(extractAtomicTokens(rawAddress)).toEqual(expectedAtomicTokens);
        });
      }
    }
  }
});
