import { beautifyName, isBeautifiedTrivialName } from "../language";
import { prioritizeRelevantPropertyVariants } from "./prioritize-relevant-property-variants";
import { PickFromPropertyVariants } from "./types";

const maxDesiredNameLength = 80;

type Result = {
  derivedBeautifiedName: string;
  name: string;
  nameSource: string;
};

export const pickName: PickFromPropertyVariants<
  "name" | "nameSource" | "derivedBeautifiedName"
> = ({ listRelevantPropertyVariants, output, targetBuildArea }) => {
  const propertyVariants = prioritizeRelevantPropertyVariants({
    callingModuleUrl: import.meta.url,
    listRelevantPropertyVariants,
    output,
    prioritizedSources: [
      "manual",
      "wikidata",
      "osm",
      "mkrf",
      "wikivoyage",
      "wikimapia",
    ],
    propertySelectors: ["name"],
    targetBuildArea,
  });

  let fallbackLongResult: Result | undefined;
  let fallbackTrivialResult: Result | undefined;

  for (const propertyVariant of propertyVariants) {
    const derivedBeautifiedName = beautifyName(
      propertyVariant.name ?? undefined,
    );
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
