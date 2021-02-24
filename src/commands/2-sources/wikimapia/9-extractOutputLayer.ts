import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateExtractOutputLayer } from "../../../shared/helpersForCommands";
import { generateWikimapiaOutputLayer } from "../../../shared/sources/wikimapia";

export const extractOutputLayer = generateExtractOutputLayer({
  source: "wikimapia",
  generateOutputLayer: generateWikimapiaOutputLayer,
});

autoStartCommandIfNeeded(extractOutputLayer, __filename);
