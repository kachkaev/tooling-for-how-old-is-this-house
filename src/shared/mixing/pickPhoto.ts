import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants } from "./types";

export const pickPhoto: PickFromPropertyVariants<
  "photoAuthorName" | "photoAuthorUrl" | "photoSource" | "photoUrl"
> = ({ listRelevantPropertyVariants, output, targetBuildArea }) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    callingFilePath: __filename,
    listRelevantPropertyVariants,
    output,
    prioritizedSources: [
      "manual",
      "wikidata",
      "wikivoyage",
      "osm",
      "mkrf",
      "wikimapia",
    ],
    propertySelectors: ["photo"],
    targetBuildArea,
  });

  for (const propertyVariant of propertyVariants) {
    if (propertyVariant.photoUrl) {
      return {
        photoAuthorName: propertyVariant.photoAuthorName,
        photoAuthorUrl: propertyVariant.photoAuthorUrl,
        photoSource: propertyVariant.source,
        photoUrl: propertyVariant.photoUrl,
      };
    }
  }

  return undefined;
};
