import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants } from "./types";

export const pickStyle: PickFromPropertyVariants<"style" | "styleSource"> = ({
  listRelevantPropertyVariants,
  logger,
  targetBuildArea,
}) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    callingFilePath: __filename,
    listRelevantPropertyVariants,
    logger,
    prioritizedSources: ["manual"],
    propertySelectors: ["style"],
    targetBuildArea,
  });

  for (const propertyVariant of propertyVariants) {
    if (propertyVariant.style) {
      return {
        style: propertyVariant.style,
        source: propertyVariant.source,
      };
    }
  }

  return undefined;
};
