export const splitNormalisedAddress = (normalizedAddress: string): string[] => {
  return normalizedAddress.split(",").map((slice) => slice.trim());
};
