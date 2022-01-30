import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants } from "./types";

export const pickMkrfUrl: PickFromPropertyVariants<
  "mkrfUrl" | "mkrfUrlSource"
> = ({ listRelevantPropertyVariants, output, targetBuildArea }) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    callingModuleUrl: import.meta.url,
    listRelevantPropertyVariants,
    output,
    prioritizedSources: ["manual", "mkrf"],
    propertySelectors: ["mkrfUrl"],
    targetBuildArea,
  });

  for (const propertyVariant of propertyVariants) {
    if (propertyVariant.mkrfUrl) {
      return {
        mkrfUrl: propertyVariant.mkrfUrl,
        mkrfUrlSource: propertyVariant.source,
      };
    }
  }

  return;
};
