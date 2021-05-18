import {
  OrdinalNumberEndingConfig,
  OrdinalNumberTextualNotationConfig,
} from "./types";

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

export const ordinalNumberTextualNotationConfigs: OrdinalNumberTextualNotationConfig[] = [
  { normalizedValue: "1-й", aliases: ["первый"] },
  { normalizedValue: "2-й", aliases: ["второй"] },
  { normalizedValue: "3-й", aliases: ["третий"] },
  { normalizedValue: "4-й", aliases: ["четвертый"] },
  { normalizedValue: "5-й", aliases: ["пятый"] },
  { normalizedValue: "6-й", aliases: ["шестой"] },
  { normalizedValue: "7-й", aliases: ["седьмой"] },
  { normalizedValue: "8-й", aliases: ["восьмой"] },
  { normalizedValue: "9-й", aliases: ["девятый"] },
  { normalizedValue: "10-й", aliases: ["десятый"] },

  { normalizedValue: "1-я", aliases: ["первая"] },
  { normalizedValue: "2-я", aliases: ["вторая"] },
  { normalizedValue: "3-я", aliases: ["третья"] },
  { normalizedValue: "4-я", aliases: ["четвертая"] },
  { normalizedValue: "5-я", aliases: ["пятая"] },
  { normalizedValue: "6-я", aliases: ["шестая"] },
  { normalizedValue: "7-я", aliases: ["седьмая"] },
  { normalizedValue: "8-я", aliases: ["восьмая"] },
  { normalizedValue: "9-я", aliases: ["девятая"] },
  { normalizedValue: "10-я", aliases: ["десятая"] },

  { normalizedValue: "1-е", aliases: ["первое"] },
  { normalizedValue: "2-е", aliases: ["второе"] },
  { normalizedValue: "3-е", aliases: ["третье"] },
  { normalizedValue: "4-е", aliases: ["четвертое"] },
  { normalizedValue: "5-е", aliases: ["пятое"] },
  { normalizedValue: "6-е", aliases: ["шестое"] },
  { normalizedValue: "7-е", aliases: ["седьмое"] },
  { normalizedValue: "8-е", aliases: ["восьмое"] },
  { normalizedValue: "9-е", aliases: ["девятое"] },
  { normalizedValue: "10-е", aliases: ["десятое"] },
];

export const ordinalNumberEndingConfigLookup: Record<
  string,
  OrdinalNumberEndingConfig
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

export const ordinalNumberTextualNotationConfigLookup: Record<
  string,
  OrdinalNumberTextualNotationConfig
> = {};

const addToLookup2 = (
  alias: string,
  config: OrdinalNumberTextualNotationConfig,
) => {
  if (ordinalNumberEndingConfigLookup[alias]) {
    throw new Error(
      `Duplicate entry in ordinalNumberTextualNotationConfigLookup for ${alias}`,
    );
  }
  ordinalNumberTextualNotationConfigLookup[alias] = config;
};

ordinalNumberTextualNotationConfigs.forEach((config) => {
  addToLookup2(config.normalizedValue, config);
  config.aliases.forEach((alias) => {
    addToLookup2(alias, config);
  });
});
