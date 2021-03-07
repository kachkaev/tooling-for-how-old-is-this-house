import { buildCleanedAddressAst } from "./buildCleanedAddressAst";
import { printCleanedAddressAst } from "./printCleanedAddressAst";
import { testCases } from "./testHelpers/testCases";

describe("printCleanedAddressAst", () => {
  testCases.forEach(({ rawAddress, expectedCleanedAddress }) => {
    if (expectedCleanedAddress) {
      it(`works for "${rawAddress}"`, () => {
        expect(
          printCleanedAddressAst(buildCleanedAddressAst(rawAddress)),
        ).toEqual(expectedCleanedAddress);
      });
    }
  });
});
