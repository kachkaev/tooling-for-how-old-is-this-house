import { prioritizeRelevantPropertyVariants } from "./prioritize-relevant-property-variants";
import { PickFromPropertyVariants } from "./types";

export const pickWikidataUrl: PickFromPropertyVariants<
  "wikidataUrl" | "wikidataUrlSource"
> = ({ listRelevantPropertyVariants, output, targetBuildArea }) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    callingModuleUrl: import.meta.url,
    listRelevantPropertyVariants,
    output,
    prioritizedSources: ["manual", "wikidata", "wikivoyage", "osm"],
    propertySelectors: ["wikidataUrl"],
    targetBuildArea,
  });

  for (const propertyVariant of propertyVariants) {
    if (propertyVariant.wikidataUrl) {
      return {
        wikidataUrl: propertyVariant.wikidataUrl,
        wikidataUrlSource: propertyVariant.source,
      };
    }
  }

  return;
};
