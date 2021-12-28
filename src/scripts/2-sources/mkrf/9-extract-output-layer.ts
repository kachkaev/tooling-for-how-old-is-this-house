import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateExtractOutputLayer } from "../../../shared/helpersForScripts";
import { generateMkrfOutputLayer } from "../../../shared/sources/mkrf";

const command = generateExtractOutputLayer({
  source: "mkrf",
  generateOutputLayer: generateMkrfOutputLayer,
  canUseCollectedGeocodes: true,
});

autoStartCommandIfNeeded(command, __filename);

export default command;
