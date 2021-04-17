import * as turf from "@turf/turf";
import { scaleLinear } from "@visx/scale";
import { interpolateRainbow } from "d3-scale-chromatic";

const scale = scaleLinear({
  domain: [1900, 2020],
  range: [1, 0.3],
  clamp: true,
});

export const mapBuildingAgeToColor = (
  feature: turf.Feature<turf.Geometry, { completionYear?: number }>,
): string => {
  const year = feature.properties.completionYear;
  if (year && year > 1000) {
    return interpolateRainbow(scale(year));
  }

  return "#3E444b";
};
