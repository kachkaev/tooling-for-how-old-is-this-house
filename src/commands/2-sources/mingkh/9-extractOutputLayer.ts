import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateExtractOutputLayer } from "../../../shared/helpersForCommands";
import { generateMingkhOutputLayer } from "../../../shared/sources/mingkh";

export const extractOutputLayer = generateExtractOutputLayer({
  source: "mingkh",
  generateOutputLayer: generateMingkhOutputLayer,
});

autoStartCommandIfNeeded(extractOutputLayer, __filename);
