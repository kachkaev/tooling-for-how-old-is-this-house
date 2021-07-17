import { scaleThreshold } from "d3-scale";

import { MapCompletionYearToColor } from "./types";

export const generateMapCompletionYearToColor = (
  colorByCompletionYear: Record<string, string>,
  colorForUnknownCompletionYear: string,
): MapCompletionYearToColor => {
  const domain: number[] = [];
  const range: string[] = [colorForUnknownCompletionYear];

  Object.entries(colorByCompletionYear).forEach(([yearAsString, color]) => {
    const year = parseInt(yearAsString);
    if (isFinite(year)) {
      domain.push(year);
      range.push(color);
    }
  });

  const scale = scaleThreshold<number, string>().domain(domain).range(range);

  return (completionYear) => {
    const year = completionYear;
    if (typeof year === "number" && isFinite(year)) {
      return scale(year);
    }

    return colorForUnknownCompletionYear;
  };
};
