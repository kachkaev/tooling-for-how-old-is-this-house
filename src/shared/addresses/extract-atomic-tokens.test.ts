import { extractAtomicTokens } from "./extract-atomic-tokens";
import { testCases } from "./test-helpers/test-cases";

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
