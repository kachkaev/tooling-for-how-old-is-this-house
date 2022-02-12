import deromanize from "deromanize";

import { normalizeSpacing } from "./normalize-spacing";

export type ResultOfParseCompletionTime =
  | {
      derivedCompletionTimeForGeosemantica?: string;
      derivedCompletionYear?: never;
      derivedCompletionYearRange?: never;
    }
  | {
      derivedCompletionTimeForGeosemantica: string;
      derivedCompletionYear: number;
      derivedCompletionYearRange: [number, number];
    };

type ResultOfParseSingleCompletionTime =
  | {
      cleanedCompletionTime?: string;
      completionYear?: never;
      completionYearRange?: never;
      assumedYear?: never;
    }
  | {
      cleanedCompletionTime: string;
      completionYear: number;
      completionYearRange: [number, number];
      assumedYear?: number;
    };

const normalizeWording = (completionTime: string): string => {
  return (
    normalizeSpacing(completionTime)
      .toLowerCase()
      .replace(/[–—−]/g, "-") // Convert different kind of dashes to hyphen
      // English letters
      .replace("a", "а")
      .replace("o", "о")
      .replace("e", "е")
      .replace("c", "с")
      .replace("p", "р")

      .replace(/примерно/g, "около") // четвёртая четверть
      .replace(/(\d{2,4})\s*-\s*е/g, "$1-е") // 90-е 1890-е
      .replace(/(\d{2,4})\s*-\s*х/g, "$1-х") // 30-х 1890-х 1890 - х
      .replace(/ё/g, "е") // четвёртая четверть
      .replace(/(\d)я /g, "$1-я ")
      .replace("-ая ", "-я ")
      .replace(/(\d)\s+-\s+(\d)/g, "$1-$2") // "1900 - 1910" → "1900-1910"
      .replace(/(?<![\p{L}])(н|нач)(\.|\s)\s?/gu, "начало ")
      .replace(/(?<![\p{L}])(к|кон)(\.|\s)\s?/gu, "конец ")
      .replace(/(?<![\p{L}])(с|сер)(\.|\s)\s?/gu, "середина ")
      .replace(
        /(?<!i)(п|пер|перв|первая|1-я|i-я|1)\.?\s?(п|пол|половина)(?!\p{L})\.?\s?/gu,
        "1-я половина ",
      )
      .replace(
        /(?<!i)(в|вт|втор|вторая|2-я|ii-я|2)\.?\s?(п|пол|половина)(?!\p{L})\.?\s?/gu,
        "2-я половина ",
      )
      .replace(
        /(?<!i)(п|пер|перв|первая|1-я|i-я|1)\.?\s?(треть)(?!\p{L})\.?\s?/gu,
        "1-я треть ",
      )
      .replace(
        /(?<!i)(в|вт|втор|вторая|2-я|ii-я|2)\.?\s?(треть)(?!\p{L})\.?\s?/gu,
        "2-я треть ",
      )
      .replace(
        /(?<!i)(п|пер|перв|первая|1-я|i-я|1)\.?\s?(чет|четв|четверть)(?!\p{L})\.?\s?/gu,
        "1-я четверть ",
      )
      .replace(
        /(?<!i)(в|вт|втор|вторая|2-я|ii-я|2)\.?\s?(чет|четв|четверть)(?!\p{L})\.?\s?/gu,
        "2-я четверть ",
      )
      .replace(
        /(?<!i)(трет|третья|3-я|iii-я|3)\.?\s?(чет|четв|четверть)(?!\p{L})\.?\s?/gu,
        "3-я четверть ",
      )
      .replace(
        /(?<!i)(чет|четв|четвертая|4-я|iv-я|4)\.?\s?(чет|четв|четверть)(?!\p{L})\.?\s?/gu,
        "4-я четверть ",
      )
      // xх is Latin + Cyrillic
      .replace(/-(го|ый|й) век/g, " век")
      .replace(/([ivxх]+)\s?-\s?/, "$1 - ")
      .replace(/^([ivxх]+) -/, "$1 век -")
      .replace(/ ([ivxх]+) -/, " $1 века -")
      .replace(/^([ivxх]+)( в| в.|)$/, "$1 век")
      .replace(/ ([ivxх]+)( в| в.|)$/, " $1 века")
      .replace(/^([ivxх]+) (в|в.|)\s?-\s?/, "$1 век - ")
      .replace(/ ([ivxх]+) (в|в.|)\s?-\s?/, " $1 века - ")
      .replace(/^([ivxх\d]+) в.?(?!(\d|\p{L}|\.))/u, "$1 век")
      .replace(/, ([ivxх\d]+) в.?(?!(\d|\p{L}|\.))/u, ", $1 век")
      .replace(/ в.?(?!(\d|\p{L}|\.))/gu, " века")
      .replace(/ вв?.?$/g, " века")
      .replace(/\s?(г|гг|год|года|годы)\.?$/g, "")
      .replace(/\s?(г|гг|год|года|годы)\.?([^\p{L}])/gu, "$2")
      .replace(
        /([ivxх]{2,}) /g,
        (match) =>
          `${deromanize(
            match.replace(/х/g, "x").trim(), // Russian ‘х’ → Latin ‘X’,
          )} `,
      )
      .replace(/[ivx]/g, (match) => match.toUpperCase())
  );
};

const centuryYearAndRangeLookup: Record<string, [number, [number, number]]> = {
  начало: [10, [0, 30]],
  середина: [50, [30, 70]],
  конец: [90, [70, 99]],
  "1-я половина": [25, [0, 50]],
  "2-я половина": [75, [50, 99]],
  "1-я треть": [20, [0, 35]],
  "2-я треть": [50, [30, 70]],
  "3-я треть": [80, [65, 99]],
  "1-я четверть": [15, [0, 30]],
  "2-я четверть": [35, [20, 55]],
  "3-я четверть": [65, [45, 80]],
  "4-я четверть": [85, [70, 99]],
};

const decadeYearAndRangeLookup: Record<string, [number, [number, number]]> = {
  начало: [2, [0, 4]],
  середина: [5, [3, 7]],
  конец: [8, [6, 9]],
};

const parseSingleCompletionTime = (
  singleCompletionTime: string,
): ResultOfParseSingleCompletionTime => {
  let result = normalizeWording(singleCompletionTime);
  if (result.length === 0) {
    return {};
  }

  // "до 1917"
  {
    const yearMatch = result.match(/^до (\d{4})$/)?.[1];
    if (yearMatch) {
      const year = Number.parseInt(yearMatch);

      return {
        cleanedCompletionTime: result,
        completionYear: year,
        completionYearRange: [-Number.MAX_SAFE_INTEGER, year],
      };
    }
  }

  // "1990-е"
  // "1990-е годы"
  {
    const decade = result.match(/^(\d{3})0-е/)?.[1];
    if (decade) {
      const decadeStartYear = Number.parseInt(decade) * 10;

      return {
        cleanedCompletionTime: `${decade}0-е`,
        completionYear: decadeStartYear + 5,
        completionYearRange: [decadeStartYear, decadeStartYear + 9],
        assumedYear: decadeStartYear + 5,
      };
    }
  }

  // "YYYY-MM-DD"
  // "DD.MM.YYYY"
  // "DD/MM/YYYY"
  // "MM/DD/YYYY"
  {
    const yearMatch =
      result.match(/(\d{4})-(\d{2})-(\d{2})/)?.[1] ??
      result.match(/(\d{2})[./](\d{2})[./](\d{4})/)?.[3];
    if (yearMatch) {
      const year = Number.parseInt(yearMatch);

      return {
        cleanedCompletionTime: yearMatch,
        completionYear: year,
        completionYearRange: [year, year],
      };
    }
  }

  // "1905-6" → "1905-1906"
  // "1910-20" → "1900-1920"
  result = result.replace(/\d{4}-\d{1,2}(?!\d)/g, (match) => {
    const [yearStart, yearEnd] = match.split("-") as [string, string];

    return `${yearStart}-${yearStart.slice(
      0,
      Math.max(0, 4 - yearEnd.length),
    )}${yearEnd}`;
  });

  // "конец 1920-х"
  {
    const [, prefixmatch, decadeMatch] =
      result.match(/^(начало|середина|конец) (\d{3}0)-?х$/) ?? [];

    const decadeYearAndRange = decadeYearAndRangeLookup[prefixmatch ?? ""];
    if (decadeYearAndRange && decadeMatch) {
      const decadeStartYear = Number.parseInt(decadeMatch);
      const year = decadeStartYear + decadeYearAndRange[0];
      result = `около ${year}`;
    }
  }

  // "конец 20-х гг. XX века"
  {
    const [, prefixmatch, decadeMatch, centuryMatch] =
      result.match(/^(начало|середина|конец) (\d0)-?х (\d{2}) века$/) ?? [];

    const decadeYearAndRange = decadeYearAndRangeLookup[prefixmatch ?? ""];
    if (decadeYearAndRange && decadeMatch && centuryMatch) {
      const decadeStartYear = Number.parseInt(decadeMatch);
      const centuryStartYear = (Number.parseInt(centuryMatch) - 1) * 100;
      const year = centuryStartYear + decadeStartYear + decadeYearAndRange[0];
      result = `около ${year}`;
    }
  }

  // "конец 1920-х - начало 1930-х"
  {
    const [, decade1Match, , decade2Match] =
      result.match(/^конец (\d{3}0)(-х)? - начало (\d{3}0)(-х)?$/) ?? [];
    if (decade1Match && decade2Match) {
      result = `около ${decade2Match}`;
    }
  }

  // "1842"
  // "1842-й"
  // "1842-м"
  // "1842-1843"
  // "около 1842"
  // "около 1842-1843"
  // "1842-1843-е"
  {
    const [, from, , to] = result.match(/(\d{4})(-(\d{4}))?/) ?? [];

    const extraAmbiguity = result.includes("около") ? 5 : 0;
    const ambiguityPrefix = extraAmbiguity ? "около " : "";
    if (from) {
      const yearFrom = Number.parseInt(from);
      if (to) {
        const yearTo = Number.parseInt(to);

        return {
          cleanedCompletionTime: `${ambiguityPrefix}${yearFrom}-${yearTo}`,
          completionYear: yearTo,
          completionYearRange: [
            yearFrom - extraAmbiguity,
            yearTo + extraAmbiguity,
          ],
        };
      }

      return {
        cleanedCompletionTime: `${ambiguityPrefix}${yearFrom}`,
        completionYear: yearFrom,
        completionYearRange: [
          yearFrom - extraAmbiguity,
          yearFrom + extraAmbiguity,
        ],
      };
    }
  }

  // "19 век"
  {
    const [, centuryMatch] = result.match(/^(\d{1,2}) век$/) ?? [];
    if (centuryMatch) {
      const centuryStartYear = (Number.parseInt(centuryMatch) - 1) * 100;

      return {
        cleanedCompletionTime: result,
        completionYear: centuryStartYear + 50,
        completionYearRange: [centuryStartYear, centuryStartYear + 99],
        assumedYear: centuryStartYear + 50,
      };
    }
  }

  // "50-60 [года - removed] 19 века"
  // "50 - 60 [гг - removed] 19 века"
  {
    const [, fromDecadeMatch, toDecadeMatch, centuryMatch] =
      result.match(/^(\d0)\s?-\s?(\d0) (\d{1,2}) века$/) ?? [];
    if (fromDecadeMatch && toDecadeMatch && centuryMatch) {
      const centuryStartYear = (Number.parseInt(centuryMatch) - 1) * 100;
      const from = centuryStartYear + Number.parseInt(fromDecadeMatch);
      const to = centuryStartYear + Number.parseInt(toDecadeMatch);

      return {
        cleanedCompletionTime: `${from}-${to}`,
        completionYear: to,
        completionYearRange: [from, to],
      };
    }
  }

  // "50-е [года - removed] 19 века"
  {
    const [, decadeMatch, , centuryMatch] =
      result.match(/^(\d0)(-е)? (\d{1,2}) века$/) ?? [];
    if (decadeMatch && centuryMatch) {
      const centuryStartYear = (Number.parseInt(centuryMatch) - 1) * 100;
      const decadeStartYear = centuryStartYear + Number.parseInt(decadeMatch);

      return {
        cleanedCompletionTime: `${decadeStartYear}-е`,
        completionYear: decadeStartYear + 5,
        completionYearRange: [decadeStartYear, decadeStartYear + 9],
        assumedYear: decadeStartYear + 5,
      };
    }
  }

  // начало 19 века
  // 1-я половина 19 века
  // конец 19 века - ...
  {
    const [, centuryPartMatch, centuryMatch] =
      result.match(/^(.*?) (\d{1,2}) века/) ?? [];
    if (centuryPartMatch && centuryMatch) {
      const centuryStartYear = (Number.parseInt(centuryMatch) - 1) * 100;
      const centuryYearAndRange = centuryYearAndRangeLookup[centuryPartMatch];
      if (centuryYearAndRange) {
        return {
          cleanedCompletionTime: result,
          completionYear: centuryStartYear + centuryYearAndRange[0],
          completionYearRange: [
            centuryStartYear + centuryYearAndRange[1][0],
            centuryStartYear + centuryYearAndRange[1][1],
          ],
          assumedYear: centuryStartYear + centuryYearAndRange[0],
        };
      }
    }
  }

  if (/[\d\p{L}]/u.test(result)) {
    // result contains at least one digit or letter
    return { cleanedCompletionTime: result };
  }

  return {};
};

const deriveCompletionYearUsingGeosemanticaRegexp = (
  completionTime: string | undefined,
): number | undefined => {
  if (!completionTime) {
    return undefined;
  }

  const completionYearMatch = completionTime.match(
    // eslint-disable-next-line unicorn/better-regex
    /\d{4}(?=,|\s|)(?!-)|\d(?:\s)\d{3}|\d{2}(?:\s)\d{2}/,
    // /\d{4}(?=,|\s|)(?!-)|\d\s\d{3}|\d{2}\s\d{2}/,
  );

  if (completionYearMatch?.[0]) {
    return Number.parseInt(completionYearMatch[0]);
  }

  return undefined;
};

const addAssumedYear = (originalValue: string, yearToAssume: number) =>
  `${originalValue} (применяется ${yearToAssume})`;

const doParseCompletionTime = (
  completionTime: string | undefined,
): ResultOfParseCompletionTime => {
  if (
    typeof completionTime !== "string" ||
    completionTime.trim().length === 0
  ) {
    return {};
  }

  const singleResults = completionTime
    .split(",")
    .map((singleCompletionTime) =>
      parseSingleCompletionTime(singleCompletionTime),
    )
    .filter((singleResult) => singleResult.cleanedCompletionTime);

  const [firstResult, ...otherResults] = singleResults;
  if (!firstResult) {
    return {};
  }

  const stringChunks = [
    firstResult.assumedYear
      ? addAssumedYear(
          firstResult.cleanedCompletionTime,
          firstResult.assumedYear,
        )
      : firstResult.cleanedCompletionTime,
    ...otherResults.map((singleResult) => singleResult.cleanedCompletionTime),
  ];

  const derivedCompletionTimeForGeosemantica = stringChunks.join(", ");

  if (firstResult.completionYear) {
    return {
      derivedCompletionTimeForGeosemantica,
      derivedCompletionYear: firstResult.completionYear,
      derivedCompletionYearRange: firstResult.completionYearRange,
    };
  }

  return { derivedCompletionTimeForGeosemantica };
};

export const parseCompletionTime = (
  completionTime: string | undefined,
): ResultOfParseCompletionTime => {
  const result = doParseCompletionTime(completionTime);

  const derivedCompletionYearUsingGeosemanticaRegexp =
    deriveCompletionYearUsingGeosemanticaRegexp(
      result.derivedCompletionTimeForGeosemantica,
    );

  if (
    result.derivedCompletionYear !==
    derivedCompletionYearUsingGeosemanticaRegexp
  ) {
    // It is safe to comment this line out if it blocks you
    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Unexpected completion year mismatch for string "${completionTime}". Local parser: ${result.derivedCompletionYear}, Geosemantica ${derivedCompletionYearUsingGeosemanticaRegexp}. If you think it’s a bug, please report it.`,
    );
  }

  return result;
};
