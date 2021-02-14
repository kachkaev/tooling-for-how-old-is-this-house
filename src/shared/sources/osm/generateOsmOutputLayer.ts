import * as turf from "@turf/turf";

import { OutputLayer } from "../../output";

export const generateOsmOutputLayer = async (): Promise<OutputLayer> => {
  return turf.featureCollection([]);
};
