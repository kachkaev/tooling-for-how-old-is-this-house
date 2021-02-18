import { GenericDesignationConfig } from "./types";

export const genericDesignationConfigs: GenericDesignationConfig[] = [
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

const genericDesignationConfigByWord: Record<
  string,
  GenericDesignationConfig
> = {};
genericDesignationConfigs.forEach((config) => {
  genericDesignationConfigByWord[config.normalizedName] = config;
  for (const alias of config.aliases) {
    genericDesignationConfigByWord[alias] = config;
  }
});

export { genericDesignationConfigByWord };

export const genericAdjectiveConfigs = [
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

const genericAdjectiveConfigByWord: Record<
  string,
  typeof genericAdjectiveConfigs[0]
> = {};

genericAdjectiveConfigs.forEach((config) => {
  for (const alias of config.aliases) {
    genericAdjectiveConfigByWord[alias] = config;
  }
  for (const normalizedName of Object.values(config.normalizedNameByGender)) {
    genericAdjectiveConfigByWord[normalizedName] = config;
  }
});

export { genericAdjectiveConfigByWord };
