// Inspired by:
// https://dev.to/ndesmic/exploring-color-math-through-color-blindness-2m2h
// https://developer.chrome.com/blog/cvd/
//
// Related:
// https://daltonlens.org/opensource-cvd-simulation/

export const colorBlindnessConditions = [
  "protanopia",
  "deuteranopia",
  "tritanopia",
  "achromatopsia",
] as const;

export type ColorBlindnessCondition = (typeof colorBlindnessConditions)[number];

export const getColorTransformMatrix = (
  condition: ColorBlindnessCondition,
): number[][] => {
  switch (condition) {
    case "protanopia":
      return [
        [0.1121, 0.8853, -0.0005, 0, 0],
        [0.1127, 0.8897, -0.0001, 0, 0],
        [0.0045, 0, 1.0019, 0, 0],
        [0, 0, 0, 1, 0],
      ];
    case "deuteranopia":
      return [
        [0.292, 0.7054, -0.0003, 0, 0],
        [0.2934, 0.7089, 0, 0, 0],
        [-0.020_98, 0.025_59, 1.0019, 0, 0],
        [0, 0, 0, 1, 0],
      ];
    case "tritanopia":
      return [
        [1.015_95, 0.1351, -0.1488, 0, 0],
        [-0.015_42, 0.8683, 0.1448, 0, 0],
        [0.1002, 0.8168, 0.1169, 0, 0],
        [0, 0, 0, 1, 0],
      ];
    case "achromatopsia":
      return [
        [0.21, 0.72, 0.07, 0, 0],
        [0.21, 0.72, 0.07, 0, 0],
        [0.21, 0.72, 0.07, 0, 0],
        [0, 0, 0, 1, 0],
      ];
  }
};

const stringifyColorTransformMatrix = (matrixRows: number[][]) => {
  return matrixRows
    .map(
      (numbersInRow) =>
        `${numbersInRow.map((number) => `${number}`).join(" ")}`,
    )
    .join("\n ");
};

export const generateColorBlindnessFilterCssProperty = (
  condition: ColorBlindnessCondition,
): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><filter id="f" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${stringifyColorTransformMatrix(
    getColorTransformMatrix(condition),
  )}" /></filter></svg>`;

  return `url('data:image/svg+xml;utf8,${encodeURI(svg)}#f')`;
};
