import chalk from "chalk";
import * as envalid from "envalid";
import { WriteStream } from "tty";

import { AddressNormalizationConfig, normalizeAddress } from "../addresses";
import { cleanEnv } from "../cleanEnv";

const debuggingEnabled = cleanEnv({
  DEBUG_NORMALIZED_ADDRESS_AUTOENCODING: envalid.bool({
    default: false,
  }),
}).DEBUG_NORMALIZED_ADDRESS_AUTOENCODING;

export const debugAddressNormalizationIfEnabled = ({
  address,
  addressNormalizationConfig,
  output,
  normalizedAddress,
}: {
  address?: string;
  addressNormalizationConfig: AddressNormalizationConfig;
  output?: WriteStream;
  normalizedAddress?: string;
}) => {
  if (!debuggingEnabled || !address || !output) {
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
      )}\n   ┌ ${address}\n   ├ ${normalizedAddress}\n   └ ${renormalizedAddress}\n`,
    );
  }
};
