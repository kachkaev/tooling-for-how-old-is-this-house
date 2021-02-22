import * as turf from "@turf/turf";

import { GenerateOutputLayer } from "../../output";

export const generateMkrfOutputLayer: GenerateOutputLayer = async () => {
  return turf.featureCollection([]);
};
