import { fixQuotes } from "./fixQuotes";

export const normalizedTrivialNames = [
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
  "детский сад",
  "дом",
  "жилой дом",
  "заброшенное здание",
  "кафе",
  "кинотеатр",
  "киоск",
  "контейнер",
  "конюшни",
  "магазин",
  "медицинский корпус",
  "мечеть",
  "музыкальная школа",
  "музыкальная школа",
  "навес",
  "общежитие",
  "офисное здание",
  "паркинг",
  "пищеблок",
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
  "флигель",
  "хлев",
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
  навес: ["крыша"],
  "спортивный зал": ["ФОК" /* физкультурно-оздоровительный комплекс */],
  "жилой дом": ["дом жилой", "жилое здание"],
  "складское здание": ["склад", "склады"],
  "строящийся объект": ["стройка", "строительство"],
  бассейн: ["плавательный бассейн"],
  гаражи: ["гаражи кирпичные", "гаражные строения", "гаражный кооператив"],
  гостиница: ["отель", "гостиничный комплекс"],
  конюшни: ["конюшня"],
  паркинг: ["стоянка", "парковка"],
  туалет: ["туалеты"],
  АЗС: ["заправка"],
  СТО: ["шиномонтаж", "станция техобслуживания"],
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

const normalizeSpacing = (name: string): string =>
  name
    .trim()
    .replace(/\s{2,}/g, " ")
    .replace(/№(\d)/g, "№ $1");

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
