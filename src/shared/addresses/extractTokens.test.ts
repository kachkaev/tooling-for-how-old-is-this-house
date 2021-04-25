import { extractTokens } from "./extractTokens";
import { testCases } from "./testHelpers/testCases";

describe("extractTokens", () => {
  testCases.forEach(({ rawAddresses, expectedTokens }) => {
    if (expectedTokens) {
      for (const rawAddress of rawAddresses) {
        it(`works for "${rawAddress}"`, () => {
          expect(extractTokens(rawAddress)).toEqual(expectedTokens);
        });
      }
    }
  });
});
