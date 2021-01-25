import * as turf from "@turf/turf";
import _ from "lodash";

export const roughenBbox = (bbox: turf.BBox, precision: number): turf.BBox => {
  return [
    _.floor(bbox[0], precision),
    _.floor(bbox[1], precision),
    _.ceil(bbox[2], precision),
    _.ceil(bbox[3], precision),
  ];
};
