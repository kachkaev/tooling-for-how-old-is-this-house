import { buildCleanedAddressAst } from "./buildCleanedAddressAst";
import { testCases } from "./testHelpers/testCases";

describe("buildCleanedAddressAst", () => {
  testCases.forEach(
    ({
      addressHandlingConfig = {},
      rawAddresses,
      expectedCleanedAddressAst,
    }) => {
      for (const rawAddress of rawAddresses) {
        if (expectedCleanedAddressAst) {
          it(`works for "${rawAddress}"`, () => {
            expect(
              buildCleanedAddressAst(rawAddress, addressHandlingConfig),
            ).toEqual(expectedCleanedAddressAst);
          });
        }
      }
    },
  );
});
