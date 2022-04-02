import { normalizeAddressAtomically } from "./normalize-address-atomically";
import { testCases } from "./test-helpers/test-cases";

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

  for (const {
    rawAddresses,
    expectedCleanedAddress,
    expectedNormalizedAtomicAddresses,
  } of testCases) {
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
  }
});
