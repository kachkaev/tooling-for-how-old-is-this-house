import { designationConfigLookup } from "./helpersForDesignations";
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
    aliases: ["б", "бол"],
    normalizedValueByGender: {
      f: "большая",
      m: "большой",
      n: "большое",
    },
  },
];

const normalizedDesignationAdjectivesSet = new Set<string>();

export const isNormalizedDesignationAdjective = (value: string): boolean =>
  normalizedDesignationAdjectivesSet.has(value);

export const designationAdjectiveConfigLookup: Record<
  string,
  DesignationAdjectiveConfig
> = {};

const addToLookup = (
  value: string,
  config: DesignationAdjectiveConfig,
  isNormalizedName?: boolean,
) => {
  if (designationAdjectiveConfigLookup[value]) {
    throw new Error(
      `Duplicate entry in designationAdjectiveConfigLookup for ${value}`,
    );
  }
  if (designationConfigLookup[value]) {
    throw new Error(
      `Clash between designationAdjectiveConfigLookup and designationConfigLookup ${value}`,
    );
  }
  designationAdjectiveConfigLookup[value] = config;
  if (isNormalizedName) {
    normalizedDesignationAdjectivesSet.add(value);
  }
};

designationAdjectiveConfigs.forEach((designationAdjectiveConfig) => {
  designationAdjectiveConfig.aliases.forEach((alias) => {
    addToLookup(alias, designationAdjectiveConfig);
    addToLookup(`${alias}.`, designationAdjectiveConfig);
  });

  Object.values(designationAdjectiveConfig.normalizedValueByGender).forEach(
    (normalizedValue) => {
      addToLookup(normalizedValue, designationAdjectiveConfig, true);
      addToLookup(`${normalizedValue}.`, designationAdjectiveConfig, true);
    },
  );
});
