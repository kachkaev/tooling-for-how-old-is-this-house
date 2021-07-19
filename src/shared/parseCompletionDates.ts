import { normalizeSpacing } from "./normalizeSpacing";

const toArabic = (romanNumber: string): number => {
  const map: Record<string, number> = {
    M: 1000,
    D: 500,
    C: 100,
    L: 50,
    X: 10,
    V: 5,
    I: 1,
  };

  const nums: string[] = romanNumber.split("");
  let result = 0;
  for (let i = 0; i < nums.length; i += 1) {
    const first = map[nums[i]!]!;
    const second = nums[i + 1] ? map[nums[i + 1]!]! : 0;
    if (first < second) {
      result += second - first;
      i += 1;
    } else {
      result += first;
    }
  }

  return result;
};

const centParts: Record<string, number> = {
  "нач.": 10,
  "сер.": 50,
  "кон.": 90,
  "1-я пол.": 25,
  "2-я пол.": 75,
  "1-я четв.": 12,
  "2-я четв.": 37,
  "3-я четв.": 62,
  "4-я четв.": 87,
};

// TODO: Change signature from string → number to string → string, keep human-readable part and add tests
export const cleanupCompletionDates = (
  completionDates: string | undefined,
): number | undefined => {
  if (!completionDates) {
    return undefined;
  }
  if (typeof completionDates === "number") {
    return completionDates;
  }
  const yearStr = completionDates.match(/\d\d\d\d/)?.[0];
  if (yearStr) {
    const year = parseInt(yearStr);
    if (year > 100) {
      return year;
    }
  }
  const centMatch = completionDates.match(/[XVI]+/i);
  if (centMatch) {
    const centStr = centMatch[0]!.toUpperCase();
    const centPart = completionDates
      .substring(0, centMatch.index)
      .trim()
      .replace("a", "а")
      .replace("o", "о")
      .replace("e", "е")
      .replace("c", "с")
      .replace("p", "р")
      .replace("-ая", "-я")
      .replace("начало", "нач.")
      .replace("конец", "кон.")
      .replace("середина", "сер.")
      .replace("п.п.", "1-я пол.")
      .replace("в.п.", "2-я пол.")
      .replace("пер.", "1-я пол.")
      .replace("вт.", "2-я пол.")
      .replace("последняя четверть", "4-я четв.")
      .replace("посл. четв.", "4-я четв.")
      .replace("половина", "пол.")
      .replace("четвертина", "четв.")
      .replace("первая", "1-я")
      .replace("вторая", "2-я")
      .replace("третья", "3-я")
      .replace("четвертая", "4-я");

    for (const cp in centParts) {
      if (centPart.startsWith(cp)) {
        const year = toArabic(centStr) * 100 - 100 + centParts[cp]!;

        return year;
      }
    }

    const year = toArabic(centStr) * 100 - 50;

    return year;
  }

  return undefined;
};

const deriveCompletionDatesForGeosemantica = (
  completionDates: string | undefined,
): string | undefined => {
  if (typeof completionDates !== "string") {
    return undefined;
  }

  let result = normalizeSpacing(completionDates);
  if (!result.length) {
    return undefined;
  }

  // "1990-е", "1990 - е" → "около 1995 (1990-е)"
  const decade = result.match(/^(\d{3})0\s*[-—–−]е$/)?.[1];
  if (decade) {
    return `около ${decade}5 (${decade}0-е)`;
  }

  // "1900 - 1910" → "1900-1910"
  result = result.replace(/(\d)\s+[-—–−]\s+(\d)/g, "$1-$2");

  return result;
};

const deriveCompletionYearFromCompletionDatesUsingGeosemanticaRegexp = (
  completionDates: string | undefined,
): number | undefined => {
  if (!completionDates) {
    return undefined;
  }

  const completionYearMatch = completionDates.match(
    // Using the same regexp as on geosemantica.ru
    /\d{4}(?=,|\s|)(?!-)|\d(?:\s)\d{3}|\d{2}(?:\s)\d{2}/,
  );

  if (completionYearMatch?.[0]) {
    return parseInt(completionYearMatch[0]);
  }

  return undefined;
};

export const parseCompletionDates = (
  completionDates: string | undefined,
): {
  derivedCompletionDatesForGeosemantica?: string;
  derivedCompletionYear?: number;
  precision?: number;
} => {
  const derivedCompletionDatesForGeosemantica = deriveCompletionDatesForGeosemantica(
    completionDates,
  );

  return {
    derivedCompletionDatesForGeosemantica,
    derivedCompletionYear: deriveCompletionYearFromCompletionDatesUsingGeosemanticaRegexp(
      derivedCompletionDatesForGeosemantica,
    ),
  };
};
