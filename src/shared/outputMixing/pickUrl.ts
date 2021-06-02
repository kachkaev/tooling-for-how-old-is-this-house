import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants } from "./types";

export const pickUrl: PickFromPropertyVariants<"url" | "urlSource"> = ({
  listRelevantPropertyVariants,
  logger,
  targetBuildArea,
}) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    listRelevantPropertyVariants,
    logger,
    prioritizedSources: ["manual", "osm"],
    propertySelectors: ["url"],
    targetBuildArea,
  });

  for (const propertyVariant of propertyVariants) {
    if (propertyVariant.url) {
      return {
        url: propertyVariant.url,
        urlSource: propertyVariant.source,
      };
    }
  }

  return undefined;
};
