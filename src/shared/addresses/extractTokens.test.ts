import { extractTokens } from "./extractTokens";
import { testCases } from "./testHelpers/testCases";

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
