import { normalizeAddressPart } from "./helpersForNormalizing";

export const normalizeBuilding = (
  building: string,
  ...rest: string[]
): string => {
  const normalizedBuilding = building
    .toLowerCase()
    .replace(/д\.\s?/, "")
    .replace(/№/g, ""); // c
  if (!rest?.length) {
    return normalizedBuilding;
  }
  const combinedRest = ` ${rest.map(normalizeAddressPart).join(" ")} `;
  const normalizedRest = combinedRest
    .replace(/№/g, "")
    .replace(/стр\.\s?/, "строение ")
    .replace(/ (строение|литера) ([^\d-]) /, "$2 ")
    .replace(/лит\.\s?/, "литера ")
    .replace(/к(орп)?\.\s?/, "корпус ")
    .replace(/(корпус|строение|литера) (0|-)/g, "");

  const combinedResult = `${normalizedBuilding}${normalizeAddressPart(
    normalizedRest,
  )}`;

  return combinedResult
    .replace(/\(?кв\.\s?[\d\s]+\)?/, "") // кв. 42 → ×
    .replace(/(\d+) ([\D\S])$/, "$1$2") // 42 б → 42б
    .trim();
};
