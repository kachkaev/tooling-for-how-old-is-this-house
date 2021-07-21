import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants } from "./types";

export const pickPhoto: PickFromPropertyVariants<
  "photoAuthorName" | "photoAuthorUrl" | "photoSource" | "photoUrl"
> = ({ listRelevantPropertyVariants, logger, targetBuildArea }) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    callingFilePath: __filename,
    listRelevantPropertyVariants,
    logger,
    prioritizedSources: [
      "manual",
      "mkrf",
      "wikidata",
      "wikivoyage",
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
