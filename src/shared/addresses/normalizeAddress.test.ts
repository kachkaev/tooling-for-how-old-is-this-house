import { compileAddressHandlingConfig } from "./helpersForWordReplacements";
import { normalizeAddress } from "./normalizeAddress";
import { testCases } from "./testHelpers/testCases";

const defaultAddressHandlingConfig = compileAddressHandlingConfig({});

describe("normalizeAddress", () => {
  it(`returns undefined for undefined`, () => {
    expect(normalizeAddress(undefined, {})).toBeUndefined();
  });

  it(`returns undefined for punctuation only`, () => {
    expect(normalizeAddress("-", {})).toBeUndefined();
    expect(normalizeAddress("  ", {})).toBeUndefined();
    expect(normalizeAddress("  - ", {})).toBeUndefined();
    expect(normalizeAddress("  / -. ", {})).toBeUndefined();
  });

  for (const {
    rawAddresses,
    expectedCleanedAddress,
    expectedNormalizedAddress,
    addressHandlingConfig = defaultAddressHandlingConfig,
  } of testCases) {
    if (expectedNormalizedAddress) {
      const rawAddressesToUse = expectedCleanedAddress
        ? [rawAddresses[0]!]
        : rawAddresses;
      for (const rawAddress of rawAddressesToUse) {
        it(`works for "${rawAddress}"`, () => {
          expect(normalizeAddress(rawAddress, addressHandlingConfig)).toEqual(
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
  }
});
