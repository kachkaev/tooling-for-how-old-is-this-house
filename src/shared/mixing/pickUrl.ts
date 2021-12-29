import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants } from "./types";

export const pickUrl: PickFromPropertyVariants<"url" | "urlSource"> = ({
  listRelevantPropertyVariants,
  output,
  targetBuildArea,
}) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    callingFilePath: __filename,
    listRelevantPropertyVariants,
    output,
    prioritizedSources: ["manual", "wikivoyage", "osm"],
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
