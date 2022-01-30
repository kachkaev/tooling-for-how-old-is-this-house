import { buildCleanedAddressAst } from "./buildCleanedAddressAst";
import { printCleanedAddressAst } from "./printCleanedAddressAst";
import { testCases } from "./testHelpers/testCases";

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
