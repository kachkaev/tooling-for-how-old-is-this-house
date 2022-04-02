import { AddressInterpretationError } from "./address-interpretation-error";
import { buildCleanedAddressAst } from "./build-cleaned-address-ast";
import { buildStandardizedAddressAst } from "./build-standardized-address-ast";
import { printStandardizedAddressAst } from "./print-standardized-address-ast";
import { testCases } from "./test-helpers/test-cases";

describe("printStandardizedAddressAst", () => {
  for (const {
    addressHandlingConfig = {},
    rawAddresses,
    expectedCleanedAddress,
    expectedStandardizedAddress,
  } of testCases) {
    if (expectedStandardizedAddress !== undefined) {
      const rawAddressesToUse = expectedCleanedAddress
        ? rawAddresses.slice(0, 1)
        : rawAddresses;

      for (const rawAddress of rawAddressesToUse) {
        if (typeof expectedStandardizedAddress !== "string") {
          it(`throws for "${rawAddress}"`, () => {
            expect(() => {
              printStandardizedAddressAst(
                buildStandardizedAddressAst(
                  buildCleanedAddressAst(rawAddress, addressHandlingConfig),
                  {},
                ),
              );
            }).toThrowError(AddressInterpretationError);
          });
        } else {
          it(`works for "${rawAddress}"`, () => {
            expect(
              printStandardizedAddressAst(
                buildStandardizedAddressAst(
                  buildCleanedAddressAst(rawAddress, addressHandlingConfig),
                  {},
                ),
              ),
            ).toEqual(expectedStandardizedAddress);
          });

          it(`autoencodes "${expectedStandardizedAddress}"`, () => {
            expect(
              printStandardizedAddressAst(
                buildStandardizedAddressAst(
                  buildCleanedAddressAst(
                    expectedStandardizedAddress,
                    addressHandlingConfig,
                  ),
                  {},
                ),
              ),
            ).toEqual(expectedStandardizedAddress);
          });
        }
      }
    }
  }
});
