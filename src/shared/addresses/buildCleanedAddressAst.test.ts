import { buildCleanedAddressAst } from "./buildCleanedAddressAst";
import { testCases } from "./testHelpers/testCases";

describe("buildCleanedAddressAst", () => {
  for (const {
    addressHandlingConfig = {},
    rawAddresses,
    expectedCleanedAddressAst,
  } of testCases) {
    for (const rawAddress of rawAddresses) {
      if (expectedCleanedAddressAst) {
        it(`works for "${rawAddress}"`, () => {
          expect(
            buildCleanedAddressAst(rawAddress, addressHandlingConfig),
          ).toEqual(expectedCleanedAddressAst);
        });
      }
    }
  }
});
