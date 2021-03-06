import { compileAddressHandlingConfig } from "./helpersForWordReplacements";
import { normalizeAddress } from "./normalizeAddress";
import { testCases } from "./testHelpers/testCases";

const defaultAddressHandlingConfig = compileAddressHandlingConfig({});

describe("normalizeAddress", () => {
  it(`returns undefined for undefined`, () => {
    expect(normalizeAddress(undefined, {})).toEqual(undefined);
  });

  it(`returns undefined for punctuation only`, () => {
    expect(normalizeAddress("-", {})).toEqual(undefined);
    expect(normalizeAddress("  ", {})).toEqual(undefined);
    expect(normalizeAddress("  - ", {})).toEqual(undefined);
    expect(normalizeAddress("  / -. ", {})).toEqual(undefined);
  });

  testCases.forEach(
    ({
      rawAddresses,
      expectedCleanedAddress,
      expectedNormalizedAddress,
      addressHandlingConfig = defaultAddressHandlingConfig,
    }) => {
      if (expectedNormalizedAddress) {
        const rawAddressesToUse = expectedCleanedAddress
          ? [rawAddresses[0]]
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
    },
  );
});
