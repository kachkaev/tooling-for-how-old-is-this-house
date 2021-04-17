import { scaleThreshold } from "@visx/scale";

const decades: Array<[number, string]> = [
  [0, "#B7FFC0"],
  [1850, "#34B561"],
  [1900, "#005a32"],

  [1920, "#FD8182"],
  [1940, "#D73740"],
  [1950, "#6C0015"],

  [1960, "#F9F399"],
  [1970, "#9A9717"],
  [1980, "#6B6503"],

  [1990, "#50A6FF"],
  [2000, "#3A75BF"],
  [2010, "#2548B2"],
];

const scale = scaleThreshold<number, string>({
  domain: decades.map(([threshold]) => threshold),
  range: ["#000", ...decades.map(([, color]) => color)],
});

export const mapBuildingCompletionYearToColor = (
  completionYear: number | undefined,
): string => {
  const year = completionYear;
  if (year && year > 1000) {
    return scale(year);
  }

  return "#3E444b";
};
