import { generateWordConfigLookup } from "./helpers-for-words";
import {
  AddressNodeWithDesignation,
  DesignationConfig,
  WordReplacementConfig,
} from "./types";

// Related info: https://wiki.openstreetmap.org/wiki/RU:Россия/Соглашение_об_именовании_дорог

// prettier-ignore
export const designationConfigs: DesignationConfig[]  = [
  { designation: "region", normalizedValue: "край", gender: "m" },
  { designation: "region", normalizedValue: "область", gender: "f", aliases: ["обл"] },
  { designation: "region", normalizedValue: "республика", gender: "f", aliases: ["респ"] },
  { designation: "region", normalizedValue: "а/о", gender: "f", beautifiedValue: "А/О" },

  { designation: "county", normalizedValue: "сельсовет", gender: "f", aliases: ["с/c"] },

  { designation: "settlement", normalizedValue: "город", gender: "m", aliases: ["г", "гор"], alwaysGoesBeforeName: true },
  { designation: "settlement", normalizedValue: "село", gender: "n", aliases: ["с"], alwaysGoesBeforeName: true },
  { designation: "settlement", normalizedValue: "поселение", gender: "n", alwaysGoesBeforeName: true },

  // Can be settlement or street
  { designation: "place", normalizedValue: "лесничество", gender: "n", aliases: ["лес-во", "лесн-во"] },
  { designation: "place", normalizedValue: "поселок", gender: "m", aliases: ["пос", "п"], beautifiedValue: "посёлок", alwaysGoesBeforeName: true },
  { designation: "place", normalizedValue: "рп", gender: "m", aliases: ['р/п'], wordReplacements: ["рабочий поселок", "р. п."], beautifiedValue: "Р/П", alwaysGoesBeforeName: true },
  
  { designation: "district", normalizedValue: "район", gender: "m", aliases: ["р-н", "р-он"] },
  { designation: "district", normalizedValue: "микрорайон", gender: "m", aliases: ["мкр", "м-н", "мкр-н"] },
  
  { designation: "street", normalizedValue: "бульвар", gender: "m", aliases: ["бульв", "б-р"] },
  { designation: "street", normalizedValue: "городок", gender: "m" },
  { designation: "street", normalizedValue: "дорога", gender: "f", aliases: ["дор", "автодорога", "а/д"], canBePartOfName: true }, 
  { designation: "street", normalizedValue: "кордон", gender: "m", canBePartOfName: true },
  { designation: "street", normalizedValue: "набережная", gender: "f", aliases: ["наб"], canBePartOfName: true },
  { designation: "street", normalizedValue: "овраг", gender: "m", canBePartOfName: true  },
  { designation: "street", normalizedValue: "переулок", gender: "m", aliases: ["пер"] },
  { designation: "street", normalizedValue: "площадь", gender: "f", aliases: ["пл"] },
  { designation: "street", normalizedValue: "порядок", gender: "m", canBePartOfName: true },
  { designation: "street", normalizedValue: "проезд", gender: "m", aliases: ["пр", "пр-д", "пр-зд", "прзд"] },
  { designation: "street", normalizedValue: "проспект", gender: "m", aliases: ["пр-т", "пр-кт", "просп"] },
  { designation: "street", normalizedValue: "разъезд", gender: "m" },
  { designation: "street", normalizedValue: "снт", gender: "n", beautifiedValue: "СНТ", alwaysGoesBeforeName: true }, // садовое некоммерческое товарищество
  { designation: "street", normalizedValue: "совхоз", gender: "m", aliases: ["свх", "совх", "с/х"], alwaysGoesBeforeName: true },
  { designation: "street", normalizedValue: "ст", gender: "n", aliases: ["с/т", "с/о", "сдт", 'ал', 'аал'], canBeSkippedIfAloneInSection: true, beautifiedValue: "С/Т", alwaysGoesBeforeName: true }, // садовое товарищество
  { designation: "street", normalizedValue: "станция", gender: "f" },
  { designation: "street", normalizedValue: "территория", gender: "f", aliases: ["тер"], canBeSkippedIfAloneInSection: true },
  { designation: "street", normalizedValue: "тупик", gender: "m", aliases: ["туп"] },
  { designation: "street", normalizedValue: "улица", gender: "f", aliases: ["ул"] },
  { designation: "street", normalizedValue: "шоссе", gender: "n", aliases: ["ш"] },

  { designation: "house", normalizedValue: "дом", gender: "m", aliases: ["д", "домовл", "домовладение"] },
  { designation: "house", normalizedValue: "здание", gender: "n", aliases: ["зд"] },
  { designation: "house", normalizedValue: "участок", gender: "m", aliases: ["з/у", "зу", "уч", "уч-к"] },

  { designation: "housePart", normalizedValue: "блок", gender: "m", aliases: ["бл", "блок-секция"] },
  { designation: "housePart", normalizedValue: "гараж", gender: "m", aliases: ["бокс", "гар"] },
  { designation: "housePart", normalizedValue: "квартира", gender: "m", aliases: ["кв"] },
  { designation: "housePart", normalizedValue: "корпус", gender: "m", aliases: ["к", "корп"] },
  { designation: "housePart", normalizedValue: "литер", gender: "f", aliases: ["литера", "лит"] },
  { designation: "housePart", normalizedValue: "место", gender: "n" },
  { designation: "housePart", normalizedValue: "погреб", gender: "m" },
  { designation: "housePart", normalizedValue: "сарай", gender: "m", aliases: ["сар"] },
  { designation: "housePart", normalizedValue: "строение", gender: "m", aliases: ["стр", "строен"] }, // has special cases in code for ‘стр’ as construction and for ‘строение’ as house number
];

export const designationConfigLookup = generateWordConfigLookup({
  wordConfigs: designationConfigs,
  wordConfigsTitle: "designationConfigs",
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

export const wordReplacementConfigsForDesignations = designationConfigs.flatMap(
  (designationConfig) =>
    (designationConfig.wordReplacements ?? []).map<WordReplacementConfig>(
      (wordReplacement) => ({
        from: wordReplacement,
        to: designationConfig.normalizedValue,
      }),
    ),
);

wordReplacementConfigsForDesignations.push(
  {
    from: ["российская федерация"],
    to: "",
  },
  {
    detached: true,
    from: ["россия", "рф"],
    to: "",
  },
);
