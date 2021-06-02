import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants } from "./types";

export const pickWikipediaUrl: PickFromPropertyVariants<
  "wikipediaUrl" | "wikipediaUrlSource"
> = ({ listRelevantPropertyVariants, logger, targetBuildArea }) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    listRelevantPropertyVariants,
    logger,
    prioritizedSources: ["manual", "osm"],
    propertySelectors: ["wikipediaUrl"],
    targetBuildArea,
  });

  for (const propertyVariant of propertyVariants) {
    if (propertyVariant.wikipediaUrl) {
      return {
        wikipediaUrl: propertyVariant.wikipediaUrl,
        wikipediaUrlSource: propertyVariant.source,
      };
    }
  }

  return undefined;
};
