import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateExtractOutputLayer } from "../../../shared/helpersForCommands";
import { generateWikiVoyageOutputLayer } from "../../../shared/sources/wikivoyage";

export const extractOutputLayer = generateExtractOutputLayer({
  source: "wikivoyage",
  generateOutputLayer: generateWikiVoyageOutputLayer,
  canUseCollectedGeocodes: true,
});

autoStartCommandIfNeeded(extractOutputLayer, __filename);
