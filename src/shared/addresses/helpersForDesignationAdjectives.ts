import { generateWordConfigLookup } from "./helpersForWords";
import { DesignationAdjectiveConfig } from "./types";

export const designationAdjectiveConfigs: DesignationAdjectiveConfig[] = [
  {
    aliases: ["м", "мал"],
    normalizedValueByGender: {
      f: "малая",
      m: "малый",
      n: "малое",
    },
  },
  {
    aliases: ["сред"],
    normalizedValueByGender: {
      f: "средняя",
      m: "средний",
      n: "среднее",
    },
  },
  {
    aliases: ["б", "бол", "больш"],
    normalizedValueByGender: {
      f: "большая",
      m: "большой",
      n: "большое",
    },
  },
];

export const designationAdjectiveConfigLookup = generateWordConfigLookup({
  wordConfigs: designationAdjectiveConfigs,
  wordConfigsTitle: "designationAdjectiveConfigs",
  getCustomAliases: (designationAdjectiveConfig) =>
    Object.values(designationAdjectiveConfig.normalizedValueByGender),
});

const normalizedDesignationAdjectivesSet = new Set<string>();

export const isNormalizedDesignationAdjective = (value: string): boolean =>
  normalizedDesignationAdjectivesSet.has(value);

for (const designationAdjectiveConfig of designationAdjectiveConfigs) {
  for (const normalizedValue of Object.values(
    designationAdjectiveConfig.normalizedValueByGender,
  )) {
    normalizedDesignationAdjectivesSet.add(normalizedValue);
  }
}
