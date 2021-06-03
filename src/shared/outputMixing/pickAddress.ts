import {
  buildCleanedAddressAst,
  buildStandardizedAddressAst,
} from "../addresses";
import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { MixedPropertyVariants, PickFromPropertyVariants } from "./types";

type Result = Pick<MixedPropertyVariants, "address" | "addressSource">;

export const pickAddress: PickFromPropertyVariants<
  "address" | "addressSource"
> = ({ listRelevantPropertyVariants, logger, targetBuildArea }) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    listRelevantPropertyVariants,
    logger,
    prioritizedSources: ["manual", "mkrf", "osm", "mingkh", "rosreestr"],
    propertySelectors: ["address"],
    targetBuildArea,
  });

  const fallbackResult: Result | undefined = undefined;

  for (const propertyVariant of propertyVariants) {
    if (propertyVariant.address) {
      const result: Result = {
        address: propertyVariant.address,
        addressSource: propertyVariant.source,
      };

      try {
        buildStandardizedAddressAst(
          buildCleanedAddressAst(propertyVariant.address),
          {},
        );

        return result;
      } catch {
        // noop (continue)
      }
    }
  }

  return fallbackResult;
};
