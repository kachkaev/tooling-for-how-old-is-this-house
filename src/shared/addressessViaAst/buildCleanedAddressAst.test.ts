import { buildCleanedAddressAst } from "./buildCleanedAddressAst";
import { testCases } from "./testHelpers/testCases";

describe("buildCleanedAddressAst", () => {
  testCases.forEach(({ rawAddress, expectedCleanedAddressAst }) => {
    if (expectedCleanedAddressAst) {
      it(`works for "${rawAddress}"`, () => {
        expect(buildCleanedAddressAst(rawAddress)).toEqual(
          expectedCleanedAddressAst,
        );
      });
    }
  });
});
