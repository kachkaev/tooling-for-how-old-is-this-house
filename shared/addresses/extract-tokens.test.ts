import { extractTokens } from "./extract-tokens";
import { testCases } from "./test-helpers/test-cases";

describe("extractTokens", () => {
  for (const { rawAddresses, expectedTokens } of testCases) {
    if (expectedTokens) {
      for (const rawAddress of rawAddresses) {
        it(`works for "${rawAddress}"`, () => {
          expect(extractTokens(rawAddress)).toEqual(expectedTokens);
        });
      }
    }
  }
});
