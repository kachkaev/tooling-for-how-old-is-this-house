export const splitAddress = (address: string): string[] => {
  return address.split(",").map((slice) => slice.trim());
};

export const combineAddressParts = (addressParts: string[]): string => {
  return addressParts.map((slice) => slice.trim()).join(", ");
};

export const normalizeAddressPart = (addressPart: string): string => {
  return addressPart
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .trim();
};
