import {
  AddressHandlingConfig,
  buildCleanedAddressAst,
  buildStandardizedAddressAst,
} from "../addresses";
import { prioritizeRelevantPropertyVariants } from "./prioritize-relevant-property-variants";
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
  output,
  targetBuildArea,
}) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    callingModuleUrl: import.meta.url,
    listRelevantPropertyVariants,
    output,
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

  return;
};
