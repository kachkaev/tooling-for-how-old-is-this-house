import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateExtractOutputLayer } from "../../../shared/helpersForCommands";
import { generateWikivoyageOutputLayer } from "../../../shared/sources/wikivoyage";

const command = generateExtractOutputLayer({
  source: "wikivoyage",
  generateOutputLayer: generateWikivoyageOutputLayer,
  canUseCollectedGeocodes: true,
});

autoStartCommandIfNeeded(command, __filename);

export default command;
