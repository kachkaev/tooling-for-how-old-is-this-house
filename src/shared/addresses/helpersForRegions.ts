import { AddressInterpretationError } from "./AddressInterpretationError";
import { buildCleanedAddressAst } from "./buildCleanedAddressAst";
import { convertSectionToSemanticPart } from "./convertSectionToSemanticPart";
import { extractSections } from "./extractSections";
import { AddressNodeWithSemanticPart, WordReplacementConfig } from "./types";

// https://ru.wikipedia.org/wiki/Коды_субъектов_Российской_Федерации
type RegionConfig = {
  gibddCode: string;
  canonicalName: string;
  customWordReplacements?: string[];
};

// prettier-ignore
export const regionConfigs: RegionConfig[] = [
  { gibddCode: "01", canonicalName: "республика Адыгея" },
  { gibddCode: "02", canonicalName: "республика Башкортостан" },
  { gibddCode: "03", canonicalName: "республика Бурятия" },
  { gibddCode: "04", canonicalName: "республика Алтай" },
  { gibddCode: "05", canonicalName: "республика Дагестан" },
  { gibddCode: "06", canonicalName: "республика Ингушетия" },
  { gibddCode: "07", canonicalName: "Кабардино-Балкарская республика" },
  { gibddCode: "08", canonicalName: "республика Калмыкия" },
  { gibddCode: "09", canonicalName: "Карачаево-Черкесская республика", customWordReplacements: ["карачаево-черкесия"] },
  { gibddCode: "10", canonicalName: "республика Карелия" },
  { gibddCode: "11", canonicalName: "республика Коми" },
  { gibddCode: "12", canonicalName: "республика Марий Эл" },
  { gibddCode: "13", canonicalName: "республика Мордовия" },
  { gibddCode: "14", canonicalName: "республика Саха", customWordReplacements: ["саха", "якутия"] },
  { gibddCode: "15", canonicalName: "республика Северная Осетия", customWordReplacements: ["северная осетия", "алания"] },
  { gibddCode: "16", canonicalName: "республика Татарстан" },
  { gibddCode: "17", canonicalName: "республика Тыва" },
  { gibddCode: "18", canonicalName: "Удмуртская республика", customWordReplacements: ["удмуртия"] },
  { gibddCode: "19", canonicalName: "республика Хакасия" },
  { gibddCode: "21", canonicalName: "Чувашская республика" },
  { gibddCode: "22", canonicalName: "Алтайский край" },
  { gibddCode: "23", canonicalName: "Краснодарский край" },
  { gibddCode: "24", canonicalName: "Красноярский край" },
  { gibddCode: "25", canonicalName: "Приморский край" },
  { gibddCode: "26", canonicalName: "Ставропольский край" },
  { gibddCode: "27", canonicalName: "Хабаровский край" },
  { gibddCode: "28", canonicalName: "Амурская область" },
  { gibddCode: "29", canonicalName: "Архангельская область" },
  { gibddCode: "30", canonicalName: "Астраханская область" },
  { gibddCode: "31", canonicalName: "Белгородская область" },
  { gibddCode: "32", canonicalName: "Брянская область" },
  { gibddCode: "33", canonicalName: "Владимирская область" },
  { gibddCode: "34", canonicalName: "Волгоградская область" },
  { gibddCode: "35", canonicalName: "Вологодская область" },
  { gibddCode: "36", canonicalName: "Воронежская область" },
  { gibddCode: "37", canonicalName: "Ивановская область" },
  { gibddCode: "38", canonicalName: "Иркутская область" },
  { gibddCode: "39", canonicalName: "Калининградская область" },
  { gibddCode: "40", canonicalName: "Калужская область" },
  { gibddCode: "41", canonicalName: "Камчатский край" },
  { gibddCode: "42", canonicalName: "Кемеровская область" },
  { gibddCode: "43", canonicalName: "Кировская область" },
  { gibddCode: "44", canonicalName: "Костромская область" },
  { gibddCode: "45", canonicalName: "Курганская область" },
  { gibddCode: "46", canonicalName: "Курская область" },
  { gibddCode: "47", canonicalName: "Ленинградская область" },
  { gibddCode: "48", canonicalName: "Липецкая область" },
  { gibddCode: "49", canonicalName: "Магаданская область" },
  { gibddCode: "50", canonicalName: "Московская область" },
  { gibddCode: "51", canonicalName: "Мурманская область" },
  { gibddCode: "52", canonicalName: "Нижегородская область" },
  { gibddCode: "53", canonicalName: "Новгородская область" },
  { gibddCode: "54", canonicalName: "Новосибирская область" },
  { gibddCode: "55", canonicalName: "Омская область" },
  { gibddCode: "56", canonicalName: "Оренбургская область" },
  { gibddCode: "57", canonicalName: "Орловская область" },
  { gibddCode: "58", canonicalName: "Пензенская область" },
  { gibddCode: "59", canonicalName: "Пермский край" },
  { gibddCode: "60", canonicalName: "Псковская область" },
  { gibddCode: "61", canonicalName: "Ростовская область" },
  { gibddCode: "62", canonicalName: "Рязанская область" },
  { gibddCode: "63", canonicalName: "Самарская область" },
  { gibddCode: "64", canonicalName: "Саратовская область" },
  { gibddCode: "65", canonicalName: "Сахалинская область" },
  { gibddCode: "66", canonicalName: "Свердловская область" },
  { gibddCode: "67", canonicalName: "Смоленская область" },
  { gibddCode: "68", canonicalName: "Тамбовская область" },
  { gibddCode: "69", canonicalName: "Тверская область" },
  { gibddCode: "70", canonicalName: "Томская область" },
  { gibddCode: "71", canonicalName: "Тульская область" },
  { gibddCode: "72", canonicalName: "Тюменская область" },
  { gibddCode: "73", canonicalName: "Ульяновская область" },
  { gibddCode: "74", canonicalName: "Челябинская область" },
  { gibddCode: "75", canonicalName: "Забайкальский край" },
  { gibddCode: "76", canonicalName: "Ярославская область" },
  // TODO: Add support for parsing federal cities (where region name === settlement name)
  // { gibddCode: "77", canonicalName: "Москва" },
  // { gibddCode: "78", canonicalName: "Санкт-Петербург" },
  { gibddCode: "79", canonicalName: "Еврейская А/О", customWordReplacements: ["еврейская а. о.", "еврейская а о", "еврейская автономная область"] },
  { gibddCode: "83", canonicalName: "Ненецкий А/О", customWordReplacements: ["ненецкий а. о.", "ненецкий а о", "ненецкий автономный округ"]},
  { gibddCode: "86", canonicalName: "Ханты-Мансийский А/О", customWordReplacements: ["ханты-мансийский а. о.", "ханты-мансийский а о", "ханты-мансийский автономный округ", "югра"] },
  { gibddCode: "87", canonicalName: "Чукотский А/О", customWordReplacements: ["чукотский а. о.", "чукотский а о", "чукотский автономный округ"] },
  { gibddCode: "89", canonicalName: "Ямало-Ненецкий А/О", customWordReplacements: ["ямало-ненецкий а. о.", "ямало-ненецкий а о", "ямало-ненецкий автономный округ"]},
  { gibddCode: "95", canonicalName: "Чеченская республика", customWordReplacements: ['чечня'] },
];

export const regionByCode: Record<string, AddressNodeWithSemanticPart> = {};

for (const { gibddCode, canonicalName } of regionConfigs) {
  const section = extractSections(buildCleanedAddressAst(canonicalName, {}))[0];
  if (!section) {
    throw new Error(
      `Unexpected empty result for ${gibddCode} → ${canonicalName}`,
    );
  }
  regionByCode[gibddCode] = convertSectionToSemanticPart(section);
}

export const resolveRegionCode = (
  regionCode: string,
): AddressNodeWithSemanticPart => {
  const result = regionByCode[regionCode];
  if (!result) {
    throw new AddressInterpretationError(
      `Unable to resolve region code ${regionCode}`,
    );
  }

  return result;
};

export const wordReplacementConfigsForRegions: WordReplacementConfig[] =
  regionConfigs.flatMap((regionConfig) => {
    const to = regionConfig.canonicalName.toLowerCase();
    const wordReplacements = regionConfig.customWordReplacements ?? [
      regionConfig.canonicalName
        .replace(/край|область|республика/, "")
        .trim()
        .toLowerCase(),
    ];

    return wordReplacements.map<WordReplacementConfig>((from) => ({
      detached: true,
      from,
      to,
    }));
  });
