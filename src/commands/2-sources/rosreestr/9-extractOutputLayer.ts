import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateExtractOutputLayer } from "../../../shared/helpersForCommands";
import { generateRosreestrOutputLayer } from "../../../shared/sources/rosreestr";

export const extractOutputLayer = generateExtractOutputLayer({
  source: "rosreestr",
  generateOutputLayer: generateRosreestrOutputLayer,
  canUseCollectedGeocodes: true,
});

autoStartCommandIfNeeded(extractOutputLayer, __filename);
