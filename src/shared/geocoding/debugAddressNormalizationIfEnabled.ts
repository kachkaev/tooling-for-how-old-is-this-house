import chalk from "chalk";
import * as envalid from "envalid";
import { WriteStream } from "node:tty";

import { AddressNormalizationConfig, normalizeAddress } from "../addresses";
import { cleanEnv } from "../cleanEnv";

let debuggingIsEnabled: boolean | undefined;

export const debugAddressNormalizationIfEnabled = ({
  address,
  addressNormalizationConfig,
  output,
  normalizedAddress,
}: {
  address?: string;
  addressNormalizationConfig: AddressNormalizationConfig;
  output?: WriteStream | undefined;
  normalizedAddress?: string;
}) => {
  // If called at root level, getting "ReferenceError: Cannot access 'cleanEnv' before initialization"
  debuggingIsEnabled ??= cleanEnv({
    DEBUG_NORMALIZED_ADDRESS_AUTOENCODING: envalid.bool({
      default: false,
    }),
  }).DEBUG_NORMALIZED_ADDRESS_AUTOENCODING;

  if (!debuggingIsEnabled || !address || !output) {
    return;
  }

  const actualNormalizedAddress =
    normalizedAddress ?? normalizeAddress(address, addressNormalizationConfig);

  const renormalizedAddress = normalizeAddress(
    actualNormalizedAddress,
    addressNormalizationConfig,
  );

  if (normalizedAddress !== renormalizedAddress) {
    output.write(
      `\n${chalk.yellow(
        "Normalized address has changed after normalization. Please report a bug.",
      )}\n   ┌ ${address}\n   ├ ${normalizedAddress ?? "<undefined>"}\n   └ ${
        renormalizedAddress ?? "<undefined>"
      }\n`,
    );
  }
};
