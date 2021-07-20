import deromanize from "deromanize";

import { normalizeSpacing } from "./normalizeSpacing";

export type ResultOfParseCompletionDates =
  | {
      derivedCompletionDatesForGeosemantica?: string;
      derivedCompletionYear?: never;
      derivedCompletionYearRange?: never;
    }
  | {
      derivedCompletionDatesForGeosemantica: string;
      derivedCompletionYear: number;
      derivedCompletionYearRange: [number, number];
    };

const normalizeWording = (completionDates: string): string => {
  return (
    normalizeSpacing(completionDates)
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
      .replace(/-(го|ый|й) век/g, " век")
      .replace(/([хivx]+)\s?-\s?/, "$1 - ")
      .replace(/^([хivx]+) -/, "$1 век -")
      .replace(/ ([хivx]+) -/, " $1 века -")
      .replace(/^([хivx]+)( в| в.|)$/, "$1 век")
      .replace(/ ([хivx]+)( в| в.|)$/, " $1 века")
      .replace(/^([хivx]+) (в|в.|)\s?-\s?/, "$1 век - ")
      .replace(/ ([хivx]+) (в|в.|)\s?-\s?/, " $1 века - ")
      .replace(/^([хivx\d]+) в.?(?!(\d|\p{L}|\.))/u, "$1 век")
      .replace(/ в.?(?!(\d|\p{L}|\.))/gu, " века")
      .replace(/ вв?.?$/g, " века")
      .replace(/\s?(г|гг|год)\.?$/g, "")
      .replace(/\s?(г|гг|год)\.?([^\p{L}])/gu, "$2")
      .replace(
        /([хivx]+) /g,
        (match) =>
          `${deromanize(
            match.replace(/х/g, "x").trim(), // Russian ‘х’ → Latin ‘X’,
          )} `,
      )
      .replace(/[xvi]/g, (match) => match.toUpperCase())
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

const addAppliedYear = (originalValue: string, yearToAssume: number) =>
  `${originalValue} (применяется ${yearToAssume})`;

const doParseCompletionDates = (
  completionDates: string | undefined,
): ResultOfParseCompletionDates => {
  if (typeof completionDates !== "string") {
    return {};
  }

  let result = normalizeWording(completionDates);
  if (!result.length) {
    return {};
  }

  // "1990-е"
  // "1990-е годы"
  {
    const decade = result.match(/^(\d{3})0-е/)?.[1];
    if (decade) {
      const decadeStartYear = parseInt(decade) * 10;

      return {
        derivedCompletionDatesForGeosemantica: addAppliedYear(
          `${decade}0-е`,
          decadeStartYear + 5,
        ),
        derivedCompletionYear: decadeStartYear + 5,
        derivedCompletionYearRange: [decadeStartYear, decadeStartYear + 9],
      };
    }
  }

  // "1905-6" → "1905-1906"
  // "1910-20" → "1900-1920"
  result = result.replace(/\d{4}-\d{1,2}(?!\d)/g, (match) => {
    const [yearStart, yearEnd] = match.split("-") as [string, string];

    return `${yearStart}-${yearStart.substr(0, 4 - yearEnd.length)}${yearEnd}`;
  });

  // "конец 1920-х"
  {
    const [, prefixmatch, decadeMatch] =
      result.match(/^(начало|середина|конец) (\d{3}0)-х?$/) ?? [];
    const decadeYearAndRange = decadeYearAndRangeLookup[prefixmatch ?? ""];
    if (decadeYearAndRange && decadeMatch) {
      const decadeStartYear = parseInt(decadeMatch);
      const year = decadeStartYear + decadeYearAndRange[0];
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
  // "1842-1843"
  // "около 1842"
  // "около 1842-1843"
  {
    const [, from, , to] = result.match(/(\d{4})(-(\d{4}))?/) ?? [];

    const extraAmbiguity = result.includes("около") ? 5 : 0;
    if (from) {
      const yearFrom = parseInt(from);
      if (to) {
        const yearTo = parseInt(to);

        return {
          derivedCompletionDatesForGeosemantica: result,
          derivedCompletionYear: yearTo,
          derivedCompletionYearRange: [
            yearFrom - extraAmbiguity,
            yearTo + extraAmbiguity,
          ],
        };
      }

      return {
        derivedCompletionDatesForGeosemantica: result,
        derivedCompletionYear: yearFrom,
        derivedCompletionYearRange: [
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
      const centuryStartYear = (parseInt(centuryMatch) - 1) * 100;

      return {
        derivedCompletionDatesForGeosemantica: addAppliedYear(
          result,
          centuryStartYear + 50,
        ),
        derivedCompletionYear: centuryStartYear + 50,
        derivedCompletionYearRange: [centuryStartYear, centuryStartYear + 99],
      };
    }
  }

  // "50-60 года 19 века"
  {
    const [, fromDecadeMatch, toDecadeMatch, centuryMatch] =
      result.match(/^(\d0)-(\d0) года (\d{1,2}) века$/) ?? [];
    if (fromDecadeMatch && toDecadeMatch && centuryMatch) {
      const centuryStartYear = (parseInt(centuryMatch) - 1) * 100;
      const from = centuryStartYear + parseInt(fromDecadeMatch);
      const to = centuryStartYear + parseInt(toDecadeMatch);

      return {
        derivedCompletionDatesForGeosemantica: `${from}-${to}`,
        derivedCompletionYear: to,
        derivedCompletionYearRange: [from, to],
      };
    }
  }

  // "50-е года 19 века"
  {
    const [, decadeMatch, , , centuryMatch] =
      result.match(/^(\d0)(-е)? (года|годы|г|г\.|гг|гг\.) (\d{1,2}) века$/) ??
      [];
    if (decadeMatch && centuryMatch) {
      const centuryStartYear = (parseInt(centuryMatch) - 1) * 100;
      const decadeStartYear = centuryStartYear + parseInt(decadeMatch);

      return {
        derivedCompletionDatesForGeosemantica: addAppliedYear(
          `${decadeStartYear}-е`,
          decadeStartYear + 5,
        ),
        derivedCompletionYear: decadeStartYear + 5,
        derivedCompletionYearRange: [decadeStartYear, decadeStartYear + 9],
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
      const centuryStartYear = (parseInt(centuryMatch) - 1) * 100;
      const centuryYearAndRange = centuryYearAndRangeLookup[centuryPartMatch];
      if (centuryYearAndRange) {
        return {
          derivedCompletionDatesForGeosemantica: addAppliedYear(
            result,
            centuryStartYear + centuryYearAndRange[0],
          ),
          derivedCompletionYear: centuryStartYear + centuryYearAndRange[0],
          derivedCompletionYearRange: [
            centuryStartYear + centuryYearAndRange[1][0],
            centuryStartYear + centuryYearAndRange[1][1],
          ],
        };
      }
    }
  }

  return {
    derivedCompletionDatesForGeosemantica: result,
  };
};

const deriveCompletionYearUsingGeosemanticaRegexp = (
  completionDates: string | undefined,
): number | undefined => {
  if (!completionDates) {
    return undefined;
  }

  const completionYearMatch = completionDates.match(
    /\d{4}(?=,|\s|)(?!-)|\d(?:\s)\d{3}|\d{2}(?:\s)\d{2}/,
  );

  if (completionYearMatch?.[0]) {
    return parseInt(completionYearMatch[0]);
  }

  return undefined;
};

export const parseCompletionDates = (
  completionDates: string | undefined,
): ResultOfParseCompletionDates => {
  const result = doParseCompletionDates(completionDates);

  const derivedCompletionYearUsingGeosemanticaRegexp = deriveCompletionYearUsingGeosemanticaRegexp(
    result.derivedCompletionDatesForGeosemantica,
  );

  if (
    result.derivedCompletionYear !==
    derivedCompletionYearUsingGeosemanticaRegexp
  ) {
    // It is safe to comment this line out if it blocks you
    throw new Error(
      `Unexpected completion year mismatch for string "${completionDates}". Local parser: ${result.derivedCompletionYear}, Geosemantica ${derivedCompletionYearUsingGeosemanticaRegexp}. This is a bug, please report it.`,
    );
  }

  return result;
};
