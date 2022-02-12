import { buildCleanedAddressAst } from "./build-cleaned-address-ast";
import { printCleanedAddressAst } from "./print-cleaned-address-ast";
import { testCases } from "./test-helpers/test-cases";

describe("printCleanedAddressAst", () => {
  for (const {
    addressHandlingConfig = {},
    rawAddresses,
    expectedCleanedAddress,
  } of testCases) {
    if (expectedCleanedAddress) {
      for (const rawAddress of rawAddresses) {
        it(`works for "${rawAddress}"`, () => {
          expect(
            printCleanedAddressAst(
              buildCleanedAddressAst(rawAddress, addressHandlingConfig),
            ),
          ).toEqual(expectedCleanedAddress);
        });
      }

      it(`autoencodes "${expectedCleanedAddress}"`, () => {
        expect(
          printCleanedAddressAst(
            buildCleanedAddressAst(
              expectedCleanedAddress,
              addressHandlingConfig,
            ),
          ),
        ).toEqual(expectedCleanedAddress);
      });
    }
  }
});
