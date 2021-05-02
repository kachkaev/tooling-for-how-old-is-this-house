import { OrdinalNumberEndingConfig } from "./types";

export const ordinalNumberEndingConfigs: OrdinalNumberEndingConfig[] = [
  {
    gender: "f",
    normalizedValue: "-я",
    aliases: ["я", "ая", "-ая", "ья", "-ья"],
  },
  {
    gender: "m",
    normalizedValue: "-й",
    aliases: ["й", "ый", "-ый", "ой", "-ой", "ий", "-ий"],
  },
  {
    gender: "n",
    normalizedValue: "-е",
    aliases: ["е", "ое", "-ое", "ье", "-ье", "ие", "-ие"],
  },
];

export const ordinalNumberEndingConfigLookup: Record<
  string,
  OrdinalNumberEndingConfig | undefined
> = {};

const addToLookup = (alias: string, config: OrdinalNumberEndingConfig) => {
  if (ordinalNumberEndingConfigLookup[alias]) {
    throw new Error(
      `Duplicate entry in ordinalNumberEndingConfigLookup for ${alias}`,
    );
  }
  ordinalNumberEndingConfigLookup[alias] = config;
};

ordinalNumberEndingConfigs.forEach((config) => {
  addToLookup(config.normalizedValue, config);
  config.aliases.forEach((alias) => {
    addToLookup(alias, config);
  });
});
