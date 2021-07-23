import {
  AddressHandlingConfig,
  buildCleanedAddressAst,
  buildStandardizedAddressAst,
} from "../addresses";
import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { MixedPropertyVariants, PickFromPropertyVariants } from "./types";

type Result = Pick<MixedPropertyVariants, "address" | "addressSource">;

export const pickAddress: PickFromPropertyVariants<
  "address" | "addressSource",
  {
    addressHandlingConfig: AddressHandlingConfig;
  }
> = ({
  addressHandlingConfig,
  listRelevantPropertyVariants,
  logger,
  targetBuildArea,
}) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    callingFilePath: __filename,
    listRelevantPropertyVariants,
    logger,
    prioritizedSources: [
      "manual",
      "osm",
      "mkrf",
      "mingkh",
      "rosreestr",
      "wikivoyage",
    ],
    propertySelectors: ["address"],
    targetBuildArea,
  });

  for (const propertyVariant of propertyVariants) {
    if (!propertyVariant.address) {
      continue;
    }

    const result: Result = {
      address: propertyVariant.address,
      addressSource: propertyVariant.source,
    };

    try {
      buildStandardizedAddressAst(
        buildCleanedAddressAst(propertyVariant.address, addressHandlingConfig),
        addressHandlingConfig,
      );

      return result;
    } catch {
      // TODO: Support non-standardized addresses as fallback option
      // (need to exclude common issues like pointers to a specific garage)
    }
  }

  return undefined;
};
