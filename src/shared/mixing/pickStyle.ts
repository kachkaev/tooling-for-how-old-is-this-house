import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants } from "./types";

export const pickStyle: PickFromPropertyVariants<"style" | "styleSource"> = ({
  listRelevantPropertyVariants,
  output,
  targetBuildArea,
}) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    callingModuleUrl: import.meta.url,
    listRelevantPropertyVariants,
    output,
    prioritizedSources: ["manual", "wikidata", "wikivoyage"],
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
