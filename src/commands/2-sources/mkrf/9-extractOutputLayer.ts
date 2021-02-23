import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateExtractOutputLayer } from "../../../shared/helpersForCommands";
import { generateMkrfOutputLayer } from "../../../shared/sources/mkrf";

export const extractOutputLayer = generateExtractOutputLayer({
  source: "mkrf",
  generateOutputLayer: generateMkrfOutputLayer,
  canUseCollectedGeocodes: true,
});

autoStartCommandIfNeeded(extractOutputLayer, __filename);
