import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateExtractOutputLayer } from "../../../shared/helpersForCommands";
import { generateWikivoyageOutputLayer } from "../../../shared/sources/wikivoyage";

export const extractOutputLayer = generateExtractOutputLayer({
  source: "wikivoyage",
  generateOutputLayer: generateWikivoyageOutputLayer,
  canUseCollectedGeocodes: true,
});

autoStartCommandIfNeeded(extractOutputLayer, __filename);
