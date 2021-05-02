import { scaleThreshold } from "@visx/scale";
import {
  interpolateCool,
  interpolateSinebow,
  interpolateSpectral,
  interpolateWarm,
} from "d3-scale-chromatic";

export const deriveCompletionYearFromCompletionDates = (
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

export const colorBinsUsingWarmAndCool: Array<[number, string]> = [
  [0, interpolateCool(0.65)],
  [1860, interpolateCool(0.8)],
  [1900, interpolateCool(0.95)],

  [1920, interpolateWarm(0.9)],
  [1930, interpolateWarm(0.75)],
  [1940, interpolateWarm(0.6)],
  [1950, interpolateWarm(0.45)],

  [1960, interpolateWarm(0.3)],
  [1970, interpolateWarm(0.15)],
  [1980, interpolateWarm(0.0)],

  [1990, interpolateCool(0.15)],
  [2000, interpolateCool(0.3)],
  [2010, interpolateCool(0.45)],
];

const step = 0.06;
export const colorBinsUsingSinebow: Array<[number, string]> = [
  [0, interpolateSinebow(0.4)],
  [1860, interpolateSinebow(0.3)],
  [1900, interpolateSinebow(0.2)],

  [1920, interpolateSinebow(0.1)],
  [1930, interpolateSinebow(0.03)],
  [1940, "#f22"],
  [1950, interpolateSinebow(1 - step * 2)],

  [1960, interpolateSinebow(1 - step * 3)],
  [1970, interpolateSinebow(1 - step * 4)],
  [1980, interpolateSinebow(1 - step * 4.8)],

  [1990, interpolateSinebow(1 - step * 6)],
  [2000, interpolateSinebow(1 - step * 7)],
  [2010, interpolateSinebow(1 - step * 8)],
];

const spectralMiddle = 0.5;
const spectralStep0 = 0.08;
const spectralStep1 = 0.06;

export const colorBinsUsingSpectral: Array<[number, string]> = [
  [0, interpolateSpectral(spectralMiddle - spectralStep0 * 6)],
  [1860, interpolateSpectral(spectralMiddle - spectralStep0 * 5)],
  [1900, interpolateSpectral(spectralMiddle - spectralStep0 * 4)],

  [1920, interpolateSpectral(spectralMiddle - spectralStep0 * 3)],
  [1930, interpolateSpectral(spectralMiddle - spectralStep0 * 2)],
  [1940, interpolateSpectral(spectralMiddle - spectralStep0 * 1)],
  [1950, interpolateSpectral(spectralMiddle + spectralStep1 * 1)],

  [1960, interpolateSpectral(spectralMiddle + spectralStep1 * 2)],
  [1970, interpolateSpectral(spectralMiddle + spectralStep1 * 3)],
  [1980, interpolateSpectral(spectralMiddle + spectralStep1 * 4)],

  [1990, interpolateSpectral(spectralMiddle + spectralStep1 * 5)],
  [2000, interpolateSpectral(spectralMiddle + spectralStep1 * 6)],
  [2010, interpolateSpectral(spectralMiddle + spectralStep1 * 7)],
];

const colorBins = colorBinsUsingSpectral;

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
