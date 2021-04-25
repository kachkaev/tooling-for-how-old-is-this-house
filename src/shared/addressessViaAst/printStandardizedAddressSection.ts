import { StandardizedAddressNodeWithSegment } from "./types";

export const printStandardizedAddressSection = (
  astNode: StandardizedAddressNodeWithSegment,
): string => {
  return astNode.words.join(" ");
};
