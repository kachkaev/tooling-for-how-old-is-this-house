import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants } from "./types";

export const pickAddress: PickFromPropertyVariants<
  "address" | "addressSource"
> = ({ listRelevantPropertyVariants, logger, targetBuildArea }) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    listRelevantPropertyVariants,
    logger,
    prioritizedSources: ["manual", "mkrf", "osm", "mingkh", "rosreestr"],
    propertyNamesThatShouldNotBeOmitted: ["address"],
    targetBuildArea,
  });

  // TODO: Take into account address syntax
  // TODO: Generate derived beautified address

  for (const propertyVariant of propertyVariants) {
    if (propertyVariant.address) {
      return {
        address: propertyVariant.address,
        addressSource: propertyVariant.source,
      };
    }
  }

  return undefined;
};
