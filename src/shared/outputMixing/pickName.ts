import { beautifyName, isBeautifiedTrivialName } from "../helpersForNames";
import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants } from "./types";

export const pickName: PickFromPropertyVariants<
  "name" | "nameSource" | "derivedBeautifiedName"
> = ({ listRelevantPropertyVariants, logger, targetBuildArea }) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    callingFilePath: __filename,
    listRelevantPropertyVariants,
    logger,
    prioritizedSources: ["manual", "mkrf", "wikivoyage", "osm", "wikimapia"],
    propertySelectors: ["name"],
    targetBuildArea,
  });

  let fallbackResult:
    | {
        derivedBeautifiedName: string;
        name: string;
        nameSource: string;
      }
    | undefined = undefined;

  for (const propertyVariant of propertyVariants) {
    if (propertyVariant.name) {
      const derivedBeautifiedName = beautifyName(propertyVariant.name);

      if (isBeautifiedTrivialName(derivedBeautifiedName)) {
        if (!fallbackResult) {
          fallbackResult = {
            derivedBeautifiedName,
            name: propertyVariant.name,
            nameSource: propertyVariant.source,
          };
        }
        continue;
      }

      return {
        derivedBeautifiedName,
        name: propertyVariant.name,
        nameSource: propertyVariant.source,
      };
    }
  }

  return fallbackResult ?? {};
};
