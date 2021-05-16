import { AddressInterpretationError } from "./AddressInterpretationError";
import { buildCleanedAddressAst } from "./buildCleanedAddressAst";
import { buildStandardizedAddressAst } from "./buildStandardizedAddressAst";
import { printStandardizedAddressAst } from "./printStandardizedAddressAst";
import { testCases } from "./testHelpers/testCases";

describe("printStandardizedAddressAst", () => {
  testCases.forEach(
    ({ rawAddresses, expectedCleanedAddress, expectedStandardizedAddress }) => {
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
                    buildCleanedAddressAst(rawAddress),
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
                    buildCleanedAddressAst(rawAddress),
                    {},
                  ),
                ),
              ).toEqual(expectedStandardizedAddress);
            });

            it(`autoencodes "${expectedStandardizedAddress}"`, () => {
              expect(
                printStandardizedAddressAst(
                  buildStandardizedAddressAst(
                    buildCleanedAddressAst(expectedStandardizedAddress),
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
