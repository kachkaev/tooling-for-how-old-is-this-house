import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants } from "./types";

export const pickName: PickFromPropertyVariants<"name" | "nameSource"> = ({
  listRelevantPropertyVariants,
  logger,
  targetBuildArea,
}) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    listRelevantPropertyVariants,
    logger,
    prioritizedSources: ["manual", "mkrf", "osm", "wikimapia"],
    propertySelectors: ["name"],
    targetBuildArea,
  });

  for (const propertyVariant of propertyVariants) {
    if (propertyVariant.name) {
      return {
        name: propertyVariant.name,
        nameSource: propertyVariant.source,
      };
    }
  }

  return undefined;
};
