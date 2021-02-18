import { DesignationAdjectiveConfig, DesignationConfig } from "./types";

export const designationConfigs: DesignationConfig[] = [
  { normalizedName: "бульвар", aliases: ["бульв."], gender: "m" },
  { normalizedName: "городок", aliases: ["городок."], gender: "m" },
  { normalizedName: "километр", aliases: ["км."], gender: "m" },
  { normalizedName: "набережная", aliases: ["наб."], gender: "f" },
  { normalizedName: "поселок", aliases: ["п."], gender: "m" },
  { normalizedName: "переулок", aliases: ["пер."], gender: "m" },
  { normalizedName: "площадь", aliases: ["пл."], gender: "f" },
  { normalizedName: "проспект", aliases: ["пр-кт.", "просп."], gender: "m" },
  { normalizedName: "проезд", aliases: ["проезд.", "пр."], gender: "m" },
  { normalizedName: "территория", aliases: ["тер."], gender: "f" },
  { normalizedName: "улица", aliases: ["ул."], gender: "f" },
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
    aliases: ["м."],
    normalizedNameByGender: {
      f: "малая",
      m: "малый",
    },
  },
  {
    aliases: ["б."],
    normalizedNameByGender: {
      f: "большая",
      m: "большой",
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
