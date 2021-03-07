import { designationWordLookup } from "./designations";
import { Gender } from "./types";

export interface DesignationAdjectiveConfig {
  normalizedNameByGender: Record<Gender, string>;
  aliases: Readonly<string[]>;
}

export const designationAdjectiveConfigs: DesignationAdjectiveConfig[] = [
  {
    aliases: ["м", "мал"],
    normalizedNameByGender: {
      f: "малая",
      m: "малый",
      n: "малое",
    },
  },
  {
    aliases: ["сред"],
    normalizedNameByGender: {
      f: "средняя",
      m: "средний",
      n: "среднее",
    },
  },
  {
    aliases: ["б", "бол"],
    normalizedNameByGender: {
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

const addToDesignationAdjectiveLookup = (
  value: string,
  config: DesignationAdjectiveConfig,
  isNormalizedName?: boolean,
) => {
  if (designationAdjectiveConfigLookup[value]) {
    throw new Error(
      `Duplicate entry in designationAdjectiveConfigLookup for ${value}`,
    );
  }
  if (designationWordLookup[value]) {
    throw new Error(
      `Clash between designationAdjectiveConfigLookup and designationWordLookup ${value}`,
    );
  }
  designationAdjectiveConfigLookup[value] = config;
  if (isNormalizedName) {
    normalizedDesignationAdjectivesSet.add(value);
  }
};

designationAdjectiveConfigs.forEach((designationAdjectiveConfig) => {
  designationAdjectiveConfig.aliases.forEach((alias) => {
    addToDesignationAdjectiveLookup(alias, designationAdjectiveConfig);
    addToDesignationAdjectiveLookup(`${alias}.`, designationAdjectiveConfig);
  });
  Object.values(designationAdjectiveConfig.normalizedNameByGender).forEach(
    (normalizedValue) => {
      addToDesignationAdjectiveLookup(
        normalizedValue,
        designationAdjectiveConfig,
        true,
      );
      addToDesignationAdjectiveLookup(
        `${normalizedValue}.`,
        designationAdjectiveConfig,
        true,
      );
    },
  );
});
