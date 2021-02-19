import { DesignationAdjectiveConfig, DesignationConfig } from "./types";

// Related info: https://wiki.openstreetmap.org/wiki/RU:Россия/Соглашение_об_именовании_дорог

export const designationConfigs: DesignationConfig[] = [
  { normalizedName: "бульвар", aliases: ["бульв."], gender: "m" },
  { normalizedName: "городок", aliases: ["городок."], gender: "m" },
  { normalizedName: "километр", aliases: ["км."], gender: "m" },
  { normalizedName: "набережная", aliases: ["наб."], gender: "f" },
  { normalizedName: "овраг", aliases: ["овраг."], gender: "m" },
  { normalizedName: "переулок", aliases: ["пер."], gender: "m" },
  { normalizedName: "площадь", aliases: ["пл."], gender: "f" },
  { normalizedName: "поселок", aliases: ["п."], gender: "m" },
  { normalizedName: "проезд", aliases: ["проезд.", "пр."], gender: "m" },
  { normalizedName: "проспект", aliases: ["пр-кт.", "просп."], gender: "m" },
  { normalizedName: "территория", aliases: ["тер."], gender: "f" },
  { normalizedName: "улица", aliases: ["ул."], gender: "f" },
  { normalizedName: "шоссе", aliases: ["ш."], gender: "n" },
];

const designationConfigByWord: Record<string, DesignationConfig> = {};
designationConfigs.forEach((config) => {
  designationConfigByWord[config.normalizedName] = config;
  for (const alias of config.aliases) {
    designationConfigByWord[alias] = config;
  }
});

export { designationConfigByWord };

export const designationAdjectiveConfigs: DesignationAdjectiveConfig[] = [
  {
    aliases: ["м.", "мал.", "мал"],
    normalizedNameByGender: {
      f: "малая",
      m: "малый",
      n: "малое",
    },
  },
  {
    aliases: ["б.", "бол.", "бол"],
    normalizedNameByGender: {
      f: "большая",
      m: "большой",
      n: "большое",
    },
  },
];

const designationAdjectiveConfigByWord: Record<
  string,
  DesignationAdjectiveConfig
> = {};

designationAdjectiveConfigs.forEach((config) => {
  for (const alias of config.aliases) {
    designationAdjectiveConfigByWord[alias] = config;
  }
  for (const normalizedName of Object.values(config.normalizedNameByGender)) {
    designationAdjectiveConfigByWord[normalizedName] = config;
  }
});

export { designationAdjectiveConfigByWord };
