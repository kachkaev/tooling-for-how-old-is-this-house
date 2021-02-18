import {
  designationAdjectiveConfigByWord,
  designationConfigByWord,
} from "./helpersForGenerics";
import { normalizeAddressPart } from "./helpersForNormalizing";

export const normalizeStreet = (street: string): string => {
  let slices = normalizeAddressPart(street).split(" ");

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

  return slices.join(" ");
};
