import { buildCleanedAddressAst } from "./buildCleanedAddressAst";
import { printCleanedAddressAst } from "./printCleanedAddressAst";
import { testCases } from "./testHelpers/testCases";

describe("printCleanedAddressAst", () => {
  testCases.forEach(
    ({ addressHandlingConfig = {}, rawAddresses, expectedCleanedAddress }) => {
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
    },
  );
});
