import { scaleThreshold } from "d3-scale";

import { MapCompletionYearToColor } from "./types";

export const generateMapCompletionYearToColor = (
  colorByCompletionYear: Record<string, string>,
  colorForUnknownCompletionYear: string,
): MapCompletionYearToColor => {
  const domain: number[] = [];
  const range: string[] = [colorForUnknownCompletionYear];

  for (const [yearAsString, color] of Object.entries(colorByCompletionYear)) {
    const year = Number.parseInt(yearAsString);
    if (Number.isFinite(year)) {
      domain.push(year);
      range.push(color);
    }
  }

  const scale = scaleThreshold<number, string>().domain(domain).range(range);

  return (completionYear) => {
    const year = completionYear;
    if (typeof year === "number" && Number.isFinite(year)) {
      return scale(year);
    }

    return colorForUnknownCompletionYear;
  };
};
