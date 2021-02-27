import {
  CompressedRosreesterCenter,
  CompressedRosreesterExtent,
  RawRosreestrCenter,
  RawRosreestrExtent,
} from "./types";

export const compressRosreestrCenter = (
  center: RawRosreestrCenter,
): CompressedRosreesterCenter => {
  return [center.x, center.y];
};

export const compressRosreestrExtent = (
  extent: RawRosreestrExtent,
): CompressedRosreesterExtent => {
  return [extent.xmin, extent.ymin, extent.xmax, extent.ymax];
};
