import chalk from "chalk";
import * as envalid from "envalid";

import { AddressNormalizationConfig, normalizeAddress } from "../addresses";
import { cleanEnv } from "../cleanEnv";

const debuggingEnabled = cleanEnv({
  DEBUG_NORMALIZED_ADDRESS_AUTOENCODING: envalid.bool({
    default: false,
  }),
}).DEBUG_NORMALIZED_ADDRESS_AUTOENCODING;

export const debugNormalizedAddressAutoencodingIfEnabled = ({
  normalizedAddress,
  addressNormalizationConfig,
  logger,
}: {
  normalizedAddress?: string;
  addressNormalizationConfig: AddressNormalizationConfig;
  logger?: Console;
}) => {
  if (!debuggingEnabled || !normalizedAddress || !logger) {
    return;
  }

  const renormalizedAddress = normalizeAddress(
    normalizedAddress,
    addressNormalizationConfig,
  );

  if (normalizedAddress !== renormalizedAddress) {
    logger.log(
      `\n${chalk.yellow(
        "Normalized address has changed after normalization. Please report a bug.",
      )}\n   ┌ ${normalizedAddress}\n   └ ${renormalizedAddress}`,
    );
  }
};
