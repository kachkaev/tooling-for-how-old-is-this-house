import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants } from "./types";

export const pickFloorCount: PickFromPropertyVariants<
  "floorCountAboveGround" | "floorCountBelowGround" | "floorCountSource"
> = ({ listRelevantPropertyVariants, output, targetBuildArea }) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    callingModuleUrl: import.meta.url,
    listRelevantPropertyVariants,
    output,
    prioritizedSources: ["manual", "osm", "mingkh", "rosreestr"],
    propertySelectors: ["floorCount"],
    targetBuildArea,
  });

  for (const {
    floorCountAboveGround,
    floorCountBelowGround,
    source,
  } of propertyVariants) {
    if (floorCountAboveGround) {
      return {
        floorCountAboveGround,
        ...(floorCountBelowGround ? { floorCountBelowGround } : {}),
        floorCountSource: source,
      };
    }
  }

  return;
};
