import { beautifyName, isBeautifiedTrivialName } from "../helpersForNames";
import { prioritizeRelevantPropertyVariants } from "./prioritizeRelevantPropertyVariants";
import { PickFromPropertyVariants } from "./types";

const maxDesiredNameLength = 80;

type Result = {
  derivedBeautifiedName: string;
  name: string;
  nameSource: string;
};

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

  let fallbackLongResult: Result | undefined = undefined;
  let fallbackTrivialResult: Result | undefined = undefined;

  for (const propertyVariant of propertyVariants) {
    const derivedBeautifiedName = beautifyName(propertyVariant.name);
    if (propertyVariant.name && derivedBeautifiedName) {
      const result: Result = {
        derivedBeautifiedName,
        name: propertyVariant.name,
        nameSource: propertyVariant.source,
      };

      if (isBeautifiedTrivialName(derivedBeautifiedName)) {
        if (!fallbackTrivialResult) {
          fallbackTrivialResult = result;
        }
        continue;
      }

      if (derivedBeautifiedName.length > maxDesiredNameLength) {
        fallbackLongResult = result;
        continue;
      }

      return result;
    }
  }

  return fallbackLongResult ?? fallbackTrivialResult ?? {};
};
