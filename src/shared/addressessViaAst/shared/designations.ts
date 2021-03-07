import { Gender } from "./types";

export type Designation =
  | "country"
  | "region"
  | "county"
  | "settlement"
  | "place"
  | "district"
  | "street"
  | "house"
  | "housePart";

export interface DesignationConfig {
  aliases?: Readonly<string[]>;
  designation: Designation;
  gender: Gender;
}

// Related info: https://wiki.openstreetmap.org/wiki/RU:Россия/Соглашение_об_именовании_дорог

const designationWordConfigLookupInner = {
  федерация: { designation: "country", gender: "f" },

  область: { designation: "region", gender: "f", aliases: ["обл"] },

  сельсовет: { designation: "county", gender: "f" },

  город: { designation: "settlement", gender: "m", aliases: ["г", "гор"] },
  село: { designation: "settlement", gender: "n", aliases: ["с"] },
  поселение: { designation: "settlement", gender: "n" },

  поселок: { designation: "settlement", gender: "n", aliases: ["пос", "п"] },
  лесничество: {
    designation: "settlement",
    gender: "n",
    aliases: ["лес-во", "лесн-во"],
  },
  городок: { designation: "place", gender: "m", aliases: [] },

  район: { designation: "district", gender: "m", aliases: ["р-н"] },

  бульвар: { designation: "street", gender: "m", aliases: ["бульв"] },
  километр: { designation: "street", gender: "m", aliases: ["км"] },
  набережная: { designation: "street", gender: "f", aliases: ["наб"] },
  овраг: { designation: "street", gender: "m", aliases: [] },
  переулок: { designation: "street", gender: "m", aliases: ["пер"] },
  площадь: { designation: "street", gender: "f", aliases: ["пл"] },
  проезд: { designation: "street", gender: "m", aliases: ["пр"] },
  проспект: { designation: "street", gender: "m", aliases: ["пр-кт", "просп"] },
  снт: { designation: "street", gender: "n", aliases: ["с/т"] }, // садовое некоммерческое товарищество
  совхоз: { designation: "street", gender: "m", aliases: [] },
  станция: { designation: "street", gender: "f", aliases: ["ст"] },
  территория: { designation: "street", gender: "f", aliases: ["тер"] },
  улица: { designation: "street", gender: "f", aliases: ["ул"] },
  шоссе: { designation: "street", gender: "n", aliases: ["ш"] },

  дом: { designation: "house", gender: "m", aliases: ["д"] },
  здание: { designation: "house", gender: "n", aliases: ["зд"] },

  блок: { designation: "housePart", gender: "m" },
  гараж: { designation: "housePart", gender: "m" },
  квартира: { designation: "housePart", gender: "m", aliases: ["кв"] },
  корпус: { designation: "housePart", gender: "m", aliases: ["к", "корп"] },
  сарай: { designation: "housePart", gender: "m", aliases: ["сар"] },
} as const;

export type DesignationWord = keyof typeof designationWordConfigLookupInner;

export const designationConfigLookup: Record<
  DesignationWord,
  DesignationConfig
> = designationWordConfigLookupInner;

export const designationWordLookup: Record<
  string,
  DesignationWord | undefined
> = {};

const addToDesignationWordLookup = (alias: string, designationWord: string) => {
  if (designationWordLookup[alias]) {
    throw new Error(`Duplicate entry in designationWordLookup for ${alias}`);
  }
  designationWordLookup[alias] = designationWord as DesignationWord;
};

Object.entries(designationConfigLookup).forEach(
  ([designationWord, { aliases }]) => {
    addToDesignationWordLookup(designationWord, designationWord);
    aliases?.forEach((alias) => {
      addToDesignationWordLookup(alias, designationWord);
      addToDesignationWordLookup(`${alias}.`, designationWord);
    });
  },
);
