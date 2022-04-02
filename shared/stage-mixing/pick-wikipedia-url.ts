import { prioritizeRelevantPropertyVariants } from "./prioritize-relevant-property-variants";
import { PickFromPropertyVariants } from "./types";

export const pickWikipediaUrl: PickFromPropertyVariants<
  "wikipediaUrl" | "wikipediaUrlSource"
> = ({ listRelevantPropertyVariants, output, targetBuildArea }) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    callingModuleUrl: import.meta.url,
    listRelevantPropertyVariants,
    output,
    prioritizedSources: ["manual", "wikidata", "wikivoyage", "osm"],
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

  return;
};
