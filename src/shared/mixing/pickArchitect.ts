import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants } from "./types";

export const pickArchitect: PickFromPropertyVariants<
  "architect" | "architectSource"
> = ({ listRelevantPropertyVariants, output, targetBuildArea }) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    callingModuleUrl: import.meta.url,
    listRelevantPropertyVariants,
    output,
    prioritizedSources: ["manual", "osm", "wikidata", "wikivoyage"],
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

  return;
};
