import { fixQuotes } from "./fixQuotes";
import { normalizeSpacing } from "./normalizeSpacing";

const normalizedTrivialNames = [
  "автосервис",
  "административное здание",
  "администрация",
  "АЗС",
  "аквапарк",
  "ангар",
  "баня",
  "бар",
  "барак",
  "бассейн",
  "беседка",
  "библиотека",
  "водонапорная башня",
  "ворота",
  "гараж",
  "гаражи",
  "гостиница",
  "дворец",
  "детский сад",
  "дом",
  "жилой дом",
  "заброшенное здание",
  "кафе",
  "кинотеатр",
  "киоск",
  "контейнер",
  "конюшня",
  "коровник",
  "коттедж",
  "крытый паркинг",
  "магазин",
  "медицинский корпус",
  "мечеть",
  "многоэтажный паркинг",
  "музыкальная школа",
  "навес",
  "общежитие",
  "офисное здание",
  "паркинг",
  "пищеблок",
  "подземный паркинг",
  "пожарная станция",
  "поликлиника",
  "почтовое отделение",
  "продукты",
  "промышленное здание",
  "разрушенный объект",
  "резервуар",
  "ресторан",
  "рынок",
  "сараи",
  "сарай",
  "свинарник",
  "складское здание",
  "спортивный зал",
  "стадион",
  "СТО",
  "столовая",
  "стоматология",
  "строящийся объект",
  "супермаркет",
  "театр",
  "теплица",
  "торговый центр",
  "трансформаторная подстанция",
  "трибуна",
  "туалет",
  "университетское здание",
  "усадьба",
  "флигель",
  "хлев",
  "хозяйственная постройка",
  "храм",
  "хранилище",
  "цветы",
  "центр культурного развития",
  "церковь",
  "цех",
  "часовня",
  "школа",
] as const;

export type TrivialName = typeof normalizedTrivialNames[number];

const synonymsByNormalizedTrivialName: Partial<
  Record<TrivialName, string[]>
> = {
  АЗС: ["заправка"],
  бассейн: ["плавательный бассейн"],
  гараж: ["гаражное строение"],
  гаражи: ["гаражи кирпичные", "гаражные строения", "гаражный кооператив"],
  гостиница: ["отель", "гостиничный комплекс"],
  "жилой дом": ["дом жилой", "жилое здание"],
  конюшня: ["конюшни"],
  навес: ["крыша"],
  паркинг: ["стоянка", "парковка"],
  "складское здание": ["склад", "склады"],
  "спортивный зал": ["ФОК" /* физкультурно-оздоровительный комплекс */],
  СТО: ["шиномонтаж", "станция техобслуживания"],
  "строящийся объект": ["стройка", "строительство"],
  туалет: ["туалеты"],
  "хозяйственная постройка": ["сарай"],
  "трансформаторная подстанция": [
    "трансформатор",
    "трансформаторная будка",
    "трансформаторная",
  ],
};

const normalizedTrivialNameByLowerCaseVersion: Record<string, TrivialName> = {};

normalizedTrivialNames.forEach((normalizedTrivialName) => {
  normalizedTrivialNameByLowerCaseVersion[
    normalizedTrivialName.toLowerCase()
  ] = normalizedTrivialName;
});

Object.entries(synonymsByNormalizedTrivialName).forEach(
  ([normalizedTrivialName, synonyms]) => {
    synonyms.forEach((synonym) => {
      normalizedTrivialNameByLowerCaseVersion[
        synonym.toLowerCase()
      ] = normalizedTrivialName as TrivialName;
    });
  },
);

const extractNormalizedTrivialName = (
  name: string,
): TrivialName | undefined => {
  return normalizedTrivialNameByLowerCaseVersion[name.toLowerCase()];
};

export const beautifyName = (name: string | undefined): string | undefined => {
  if (!name) {
    return undefined;
  }
  const nameWithNormalizedSpacing = normalizeSpacing(name);

  return (
    extractNormalizedTrivialName(nameWithNormalizedSpacing) ??
    fixQuotes(nameWithNormalizedSpacing)
  );
};

export const isBeautifiedTrivialName = (
  name: string | undefined,
): name is TrivialName =>
  Boolean(
    name &&
      normalizedTrivialNameByLowerCaseVersion[name.toLowerCase()] === name,
  );
