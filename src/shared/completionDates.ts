import { scaleThreshold } from "@visx/scale";
import {
  interpolateCool,
  interpolateSinebow,
  interpolateSpectral,
  interpolateWarm,
} from "d3-scale-chromatic";

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

export const deriveCompletionYearFromCompletionDates = (
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

export const stringifyCompletionYear = (completionYear: number | undefined) => {
  return completionYear ? `${completionYear}` : undefined;
};
