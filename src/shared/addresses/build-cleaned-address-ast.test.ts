import { buildCleanedAddressAst } from "./build-cleaned-address-ast";
import { testCases } from "./test-helpers/test-cases";

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
