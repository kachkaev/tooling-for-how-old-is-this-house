// TODO: implement and test
import { scaleThreshold } from "@visx/scale";

export const extractYearFromCompletionDates = (
  completionDates: string | undefined,
): number | undefined => {
  if (!completionDates) {
    return undefined;
  }

  const result = parseInt(completionDates);

  return isFinite(result) ? result : undefined;
};

export const stringifyCompletionYear = (completionYear: number | undefined) => {
  return completionYear ? `${completionYear}` : undefined;
};

// Colors

const unknownYearColor = "#3E444b";

const colorBins: Array<[number, string]> = [
  [0, "#B7FFC0"],
  [1860, "#34B561"],
  [1900, "#005a32"],

  [1920, "#6C0015"],
  [1940, "#D73740"],
  [1950, "#FD8182"],

  [1960, "#F9F399"],
  [1970, "#9A9717"],
  [1980, "#6B6503"],

  [1990, "#2548B2"],
  [2000, "#3A75BF"],
  [2010, "#50A6FF"],
];

const scale = scaleThreshold<number, string>({
  domain: colorBins.map(([threshold]) => threshold),
  range: ["#000", ...colorBins.map(([, color]) => color)],
});

export const mapCompletionYearToColor = (
  completionYear: number | undefined,
): string => {
  const year = completionYear;
  if (year && year > 1000) {
    return scale(year);
  }

  return unknownYearColor;
};
