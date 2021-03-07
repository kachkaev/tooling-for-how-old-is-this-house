import { DesignationConfig } from "./types";

// Related info: https://wiki.openstreetmap.org/wiki/RU:Россия/Соглашение_об_именовании_дорог

// prettier-ignore
const designationConfigs: DesignationConfig[]  = [
  { designation: "country", normalizedValue: "федерация", gender: "f" },

  { designation: "region", normalizedValue: "область", gender: "f", aliases: ["обл"] },

  { designation: "county", normalizedValue: "сельсовет", gender: "f" },

  { designation: "settlement", normalizedValue: "город", gender: "m", aliases: ["г", "гор"] },
  { designation: "settlement", normalizedValue: "село", gender: "n", aliases: ["с"] },
  { designation: "settlement", normalizedValue: "поселение", gender: "n" },

  { designation: "settlement", normalizedValue: "поселок", gender: "n", aliases: ["пос", "п"] },
  { designation: "settlement", normalizedValue: "лесничество", gender: "n", aliases: ["лес-во", "лесн-во"] },
  
  { designation: "place", normalizedValue: "городок", gender: "m", aliases: [] },
  { designation: "place", normalizedValue: "гск", gender: "m", aliases: ["гк"] },

  { designation: "district", normalizedValue: "район", gender: "m", aliases: ["р-н"] },
  { designation: "district", normalizedValue: "микрорайон", gender: "m", aliases: ["мкр", "м-н"] },
  
  { designation: "street", normalizedValue: "бульвар", gender: "m", aliases: ["бульв"] },
  { designation: "street", normalizedValue: "километр", gender: "m", aliases: ["км"] },
  { designation: "street", normalizedValue: "набережная", gender: "f", aliases: ["наб"] },
  { designation: "street", normalizedValue: "овраг", gender: "m", aliases: [] },
  { designation: "street", normalizedValue: "переулок", gender: "m", aliases: ["пер"] },
  { designation: "street", normalizedValue: "площадь", gender: "f", aliases: ["пл"] },
  { designation: "street", normalizedValue: "проезд", gender: "m", aliases: ["пр"] },
  { designation: "street", normalizedValue: "проспект", gender: "m", aliases: ["пр-т", "пр-кт", "просп"] },
  { designation: "street", normalizedValue: "снт", gender: "n", aliases: ["с/т"] }, // садовое некоммерческое товарищество
  { designation: "street", normalizedValue: "совхоз", gender: "m", aliases: ["свх", "совх", "с/х"] },
  { designation: "street", normalizedValue: "станция", gender: "f", aliases: ["ст"] },
  { designation: "street", normalizedValue: "территория", gender: "f", aliases: ["тер"] },
  { designation: "street", normalizedValue: "улица", gender: "f", aliases: ["ул"] },
  { designation: "street", normalizedValue: "шоссе", gender: "n", aliases: ["ш"] },

  { designation: "house", normalizedValue: "дом", gender: "m", aliases: ["д"] },
  { designation: "house", normalizedValue: "здание", gender: "n", aliases: ["зд"] },
  { designation: "house", normalizedValue: "участок", gender: "m", aliases: ["з/у", "уч"] },

  { designation: "housePart", normalizedValue: "блок", gender: "m", aliases: ["бл"] },
  { designation: "housePart", normalizedValue: "гараж", gender: "m", aliases: ["бокс", "гар"] },
  { designation: "housePart", normalizedValue: "квартира", gender: "m", aliases: ["кв"] },
  { designation: "housePart", normalizedValue: "корпус", gender: "m", aliases: ["к", "корп"] },
  { designation: "housePart", normalizedValue: "сарай", gender: "m", aliases: ["сар"] },
  { designation: "housePart", normalizedValue: "строение", gender: "m", aliases: ["стр", "строен"] },
];

export const designationConfigLookup: Record<
  string,
  DesignationConfig | undefined
> = {};

const addToLookup = (alias: string, config: DesignationConfig) => {
  if (designationConfigLookup[alias]) {
    throw new Error(`Duplicate entry in designationConfigLookup for ${alias}`);
  }
  designationConfigLookup[alias] = config;
};

designationConfigs.forEach((designationConfig) => {
  addToLookup(designationConfig.normalizedValue, designationConfig);
  designationConfig.aliases?.forEach((alias) => {
    addToLookup(alias, designationConfig);
    addToLookup(`${alias}.`, designationConfig);
  });
});
