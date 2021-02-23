import { normalizeAddressPart } from "./helpersForNormalizing";

export const normalizePlace = (place: string): string => {
  let slices = normalizeAddressPart(place).split(" ");

  slices = slices.filter((slice) => {
    if (["г", "г.", "гор", "гор.", "город"].includes(slice)) {
      return false;
    }

    return true;
  });

  const joinedSlices = slices.join(" ");

  return joinedSlices;
};
