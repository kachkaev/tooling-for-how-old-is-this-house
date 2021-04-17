import { scaleLinear } from "@visx/scale";
import { interpolateRainbow } from "d3-scale-chromatic";

const scale = scaleLinear({
  domain: [1900, 2020],
  range: [1, 0.3],
  clamp: true,
});

export const mapBuildingCompletionYearToColor = (
  completionYear: number | undefined,
): string => {
  const year = completionYear;
  if (year && year > 1000) {
    return interpolateRainbow(scale(year));
  }

  return "#3E444b";
};
