import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants } from "./types";

export const pickArchitect: PickFromPropertyVariants<
  "architect" | "architectSource"
> = ({ listRelevantPropertyVariants, logger, targetBuildArea }) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    callingFilePath: __filename,
    listRelevantPropertyVariants,
    logger,
    prioritizedSources: ["manual", "wikivoyage"],
    propertySelectors: ["architect"],
    targetBuildArea,
  });

  for (const propertyVariant of propertyVariants) {
    if (propertyVariant.architect) {
      return {
        architect: propertyVariant.architect,
        source: propertyVariant.source,
      };
    }
  }

  return undefined;
};
