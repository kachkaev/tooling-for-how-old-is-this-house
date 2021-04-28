import { normalizeAddress } from "./normalizeAddress";
import { testCases } from "./testHelpers/testCases";

describe("normalizeAddress", () => {
  it(`returns undefined for undefined`, () => {
    expect(normalizeAddress(undefined, {})).toEqual(undefined);
  });

  testCases.forEach(
    ({ rawAddresses, expectedCleanedAddress, expectedNormalizedAddress }) => {
      if (expectedNormalizedAddress) {
        const rawAddressesToUse = expectedCleanedAddress
          ? [rawAddresses[0]]
          : rawAddresses;
        for (const rawAddress of rawAddressesToUse) {
          it(`works for "${rawAddress}"`, () => {
            expect(normalizeAddress(rawAddress, {})).toEqual(
              expectedNormalizedAddress,
            );
          });

          it(`autoencodes "${expectedNormalizedAddress}"`, () => {
            expect(normalizeAddress(expectedNormalizedAddress, {})).toEqual(
              expectedNormalizedAddress,
            );
          });
        }
      }
    },
  );
});
