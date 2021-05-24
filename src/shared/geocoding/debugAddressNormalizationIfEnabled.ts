import chalk from "chalk";
import * as envalid from "envalid";

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
  logger,
  normalizedAddress,
}: {
  address?: string;
  addressNormalizationConfig: AddressNormalizationConfig;
  logger?: Console;
  normalizedAddress?: string;
}) => {
  if (!debuggingEnabled || !address || !logger) {
    return;
  }

  const actualNormalizedAddress =
    normalizedAddress ?? normalizeAddress(address, addressNormalizationConfig);

  const renormalizedAddress = normalizeAddress(
    actualNormalizedAddress,
    addressNormalizationConfig,
  );

  if (normalizedAddress !== renormalizedAddress) {
    logger.log(
      `\n${chalk.yellow(
        "Normalized address has changed after normalization. Please report a bug.",
      )}\n   ┌ ${address}\n   ├ ${normalizedAddress}\n   └ ${renormalizedAddress}`,
    );
  }
};
