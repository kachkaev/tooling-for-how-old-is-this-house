import { normalizeAddressPart } from "./helpersForNormalizing";
import {
  designationAdjectiveConfigByWord,
  designationConfigByWord,
} from "./helpersForToponyms";

export const normalizeStreet = (street: string): string => {
  // ул.в.в.тестова → ул. в. в. тестова
  let slices = normalizeAddressPart(street.replace(/\./g, ". ")).split(" ");

  // ул. → улица
  // тестовая улица → улица тестовая
  const designationIndex = slices.findIndex(
    (slice) => designationConfigByWord[slice],
  );
  const designationConfig =
    designationConfigByWord[slices[designationIndex] ?? ""];
  if (designationConfig) {
    slices = [
      designationConfig.normalizedName,
      ...slices.slice(0, designationIndex),
      ...slices.slice(designationIndex + 1),
    ];
  }

  // улица тестовая б. → улица большая тестовая
  const adjectiveIndex = slices.findIndex(
    (slice) => designationAdjectiveConfigByWord[slice],
  );
  const adjectiveConfig =
    designationAdjectiveConfigByWord[slices[adjectiveIndex] ?? ""];
  if (adjectiveConfig && designationConfig) {
    const normalizedAdjectiveForGender =
      adjectiveConfig.normalizedNameByGender[designationConfig.gender];
    slices = [
      ...slices.slice(0, adjectiveIndex),
      ...slices.slice(adjectiveIndex + 1),
      normalizedAdjectiveForGender,
    ];
  }

  // улица 1-я тестовая → улица тестовая 1-я
  const numericPartIndex = slices.findIndex((slice) =>
    slice.match(/^(\d+)-?(ы|а)?(й|я)$/),
  );
  if (numericPartIndex !== -1) {
    const normalizedNumericPart = slices[numericPartIndex]!.replace(
      /^(\d+)-?(ы|а)?(й|я)$/,
      "$1-$3",
    );
    slices = [
      ...slices.slice(0, numericPartIndex),
      ...slices.slice(numericPartIndex + 1),
      normalizedNumericPart,
    ];
  }

  let joinedSlices = slices.join(" ");

  // улица и. и. тестова → улица тестова
  // улица и. тестова → улица тестова
  joinedSlices = joinedSlices.replace(/\p{L}\.\s(\p{L}\.\s)?(\p{L}+)/u, "$2");

  return joinedSlices;
};
