import {
  genericAdjectiveConfigByWord,
  genericDesignationConfigByWord,
} from "./helpersForGenerics";
import { normalizeAddressPart } from "./helpersForNormalizing";

export const normalizeStreet = (street: string): string => {
  let slices = normalizeAddressPart(street).split(" ");

  // ул. → улица
  // тестовая улица → улица тестовая
  const designationIndex = slices.findIndex(
    (slice) => genericDesignationConfigByWord[slice],
  );
  const designationConfig =
    genericDesignationConfigByWord[slices[designationIndex] ?? ""];
  if (designationConfig) {
    slices = [
      designationConfig.normalizedName,
      ...slices.slice(0, designationIndex),
      ...slices.slice(designationIndex + 1),
    ];
  }

  // улица тестовая б. → улица большая тестовая
  const adjectiveIndex = slices.findIndex(
    (slice) => genericAdjectiveConfigByWord[slice],
  );
  const adjectiveConfig =
    genericAdjectiveConfigByWord[slices[adjectiveIndex] ?? ""];
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

  return normalizeAddressPart(street)
    .toLowerCase()
    .replace("городок. ", "городок ")
    .replace("км. ", "километр ")
    .replace("наб. ", "набережная ")
    .replace("п. ", "поселок ")
    .replace("пер. ", "переулок ")
    .replace("пл. ", "площадь ")
    .replace("пр-кт. ", "проспект ")
    .replace("проезд. ", "проезд ")
    .replace("тер. ", "территория ")
    .replace("ул. ", "улица ")
    .replace(/^(набережная|площадь|территория|улица) (.*) м.$/, "$1 малая $2")
    .replace(/^(набережная|площадь|территория|улица) (.*) б.$/, "$1 большая $2")
    .replace(
      /^(городок|километр|поселок|переулок|проспект|проезд) (.*) м.$/,
      "$1 малый $2",
    )
    .replace(
      /^(городок|километр|поселок|переулок|проспект|проезд) (.*) б.$/,
      "$1 большой $2",
    )
    .trim();
};
