import { normalizeAddressAtomically } from "./normalizeAddressAtomically";
import { testCases } from "./testHelpers/testCases";

describe("normalizeAddressAtomically", () => {
  it(`returns [] for undefined`, () => {
    expect(normalizeAddressAtomically(undefined, {})).toEqual([]);
  });

  it(`returns [] for punctuation only`, () => {
    expect(normalizeAddressAtomically("-", {})).toEqual([]);
    expect(normalizeAddressAtomically("  ", {})).toEqual([]);
    expect(normalizeAddressAtomically("  - ", {})).toEqual([]);
    expect(normalizeAddressAtomically("  / -. ", {})).toEqual([]);
  });

  testCases.forEach(
    ({
      rawAddresses,
      expectedCleanedAddress,
      expectedNormalizedAtomicAddresses,
    }) => {
      if (expectedNormalizedAtomicAddresses) {
        const rawAddressesToUse = expectedCleanedAddress
          ? [rawAddresses[0]!]
          : rawAddresses;
        for (const rawAddress of rawAddressesToUse) {
          it(`works for "${rawAddress}"`, () => {
            expect(normalizeAddressAtomically(rawAddress, {})).toEqual(
              expectedNormalizedAtomicAddresses,
            );
          });
        }
      }
    },
  );
});
