import { AddressInterpretationError } from "./AddressInterpretationError";
import { buildCleanedAddressAst } from "./buildCleanedAddressAst";
import { buildStandardizedAddressAst } from "./buildStandardizedAddressAst";
import { printStandardizedAddressAst } from "./printStandardizedAddressAst";
import { testCases } from "./testHelpers/testCases";

describe("printStandardizedAddressAst", () => {
  testCases.forEach(
    ({
      addressHandlingConfig = {},
      rawAddresses,
      expectedCleanedAddress,
      expectedStandardizedAddress,
    }) => {
      if (expectedStandardizedAddress !== undefined) {
        const rawAddressesToUse = expectedCleanedAddress
          ? rawAddresses.slice(0, 1)
          : rawAddresses;

        for (const rawAddress of rawAddressesToUse) {
          if (expectedStandardizedAddress === null) {
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
    },
  );
});
