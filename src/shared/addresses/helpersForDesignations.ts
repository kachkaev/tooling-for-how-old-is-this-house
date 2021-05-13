import { AddressNodeWithDesignation, DesignationConfig } from "./types";

// Related info: https://wiki.openstreetmap.org/wiki/RU:Россия/Соглашение_об_именовании_дорог

// prettier-ignore
const designationConfigs: DesignationConfig[]  = [
  { designation: "country", normalizedValue: "федерация", gender: "f" },

  // TODO: add more regions based on federal division of Russia
  { designation: "region", normalizedValue: "край", gender: "m" },
  { designation: "region", normalizedValue: "область", gender: "f", aliases: ["обл"] },
  { designation: "region", normalizedValue: "республика", gender: "f", aliases: ["респ"] },

  { designation: "county", normalizedValue: "сельсовет", gender: "f" },

  { designation: "settlement", normalizedValue: "город", gender: "m", aliases: ["г", "гор"] },
  { designation: "settlement", normalizedValue: "село", gender: "n", aliases: ["с"] },
  { designation: "settlement", normalizedValue: "поселение", gender: "n" },

  // Can be settlement or street
  { designation: "place", normalizedValue: "поселок", gender: "n", aliases: ["пос", "п", "рп" /* рабочий поселок */] },
  { designation: "place", normalizedValue: "лесничество", gender: "n", aliases: ["лес-во", "лесн-во"] },
  
  { designation: "district", normalizedValue: "район", gender: "m", aliases: ["р-н", 'р-он'] },
  { designation: "district", normalizedValue: "микрорайон", gender: "m", aliases: ["мкр", "м-н"] },
  
  { designation: "street", normalizedValue: "бульвар", gender: "m", aliases: ["бульв", "б-р"] },
  { designation: "street", normalizedValue: "городок", gender: "m", aliases: [] },
  { designation: "street", normalizedValue: "гск", gender: "m", aliases: ["гк"] },
  { designation: "street", normalizedValue: "дорога", gender: "f", aliases: ["дор"] },
  { designation: "street", normalizedValue: "километр", gender: "m", aliases: ["км"] },
  { designation: "street", normalizedValue: "кордон", gender: "m" },
  { designation: "street", normalizedValue: "набережная", gender: "f", aliases: ["наб"], canBePartOfName: true },
  { designation: "street", normalizedValue: "овраг", gender: "m", aliases: [] },
  { designation: "street", normalizedValue: "переулок", gender: "m", aliases: ["пер"] },
  { designation: "street", normalizedValue: "порядок", gender: "m" },
  { designation: "street", normalizedValue: "площадь", gender: "f", aliases: ["пл"] },
  { designation: "street", normalizedValue: "проезд", gender: "m", aliases: ["пр", "пр-д"] },
  { designation: "street", normalizedValue: "проспект", gender: "m", aliases: ["пр-т", "пр-кт", "просп"] },
  { designation: "street", normalizedValue: "разъезд", gender: "m" },
  { designation: "street", normalizedValue: "снт", gender: "n", aliases: ["с/т", "сдт"] }, // садовое некоммерческое товарищество
  { designation: "street", normalizedValue: "совхоз", gender: "m", aliases: ["свх", "совх", "с/х"] },
  { designation: "street", normalizedValue: "станция", gender: "f", aliases: ["ст"] },
  { designation: "street", normalizedValue: "территория", gender: "f", aliases: ["тер"] },
  { designation: "street", normalizedValue: "тупик", gender: "m", aliases: ["туп"] },
  { designation: "street", normalizedValue: "улица", gender: "f", aliases: ["ул"] },
  { designation: "street", normalizedValue: "шоссе", gender: "n", aliases: ["ш"] },

  { designation: "house", normalizedValue: "дом", gender: "m", aliases: ["д"] },
  { designation: "house", normalizedValue: "здание", gender: "n", aliases: ["зд"] },
  { designation: "house", normalizedValue: "участок", gender: "m", aliases: ["з/у", "уч", "уч-к"] },

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
  addToLookup(`${designationConfig.normalizedValue}.`, designationConfig);
  designationConfig.aliases?.forEach((alias) => {
    addToLookup(alias, designationConfig);
    addToLookup(`${alias}.`, designationConfig);
  });
});

export const getDesignationConfig = (
  designationWord: AddressNodeWithDesignation,
): DesignationConfig => {
  const designationConfig = designationConfigLookup[designationWord.value];
  if (!designationConfig) {
    throw new Error(
      `Unable to find designationConfig for ${designationWord.value}`,
    );
  }

  return designationConfig;
};
