export const splitAddress = (address: string): string[] => {
  return address.split(",").map((slice) => slice.trim());
};

export const combineAddressParts = (addressParts: string[]): string => {
  return addressParts.map((slice) => slice.trim()).join(", ");
};

export const normalizeAddressPart = (addressPart: string): string => {
  return addressPart.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ");
};

export const normalizeStreet = (street: string): string => {
  return street
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
    .replace("ул. ", "улица ");
};
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
  const combinedRest = ` ${rest.map(normalizeAddressPart).join(" ")}`;
  const normalizedRest = combinedRest
    .replace(/№/g, "")
    .replace(/стр\.\s?/, "строение ")
    .replace(/ строение ([^\d]) /, "$1 ")
    .replace(/лит\.\s?/, "литера ")
    .replace(/к(орп)?\.\s?/, "корпус ")
    .replace(/(корпус|строение|литера) (0|-)/g, "");

  return `${normalizedBuilding}${normalizeAddressPart(normalizedRest)}`;
};
