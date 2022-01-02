import { AddressInterpretationError } from "./AddressInterpretationError";
import { buildCleanedAddressAst } from "./buildCleanedAddressAst";
import { buildStandardizedAddressAst } from "./buildStandardizedAddressAst";
import { printStandardizedAddressAst } from "./printStandardizedAddressAst";
import { testCases } from "./testHelpers/testCases";

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
