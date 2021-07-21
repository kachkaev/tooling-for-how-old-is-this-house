import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateExtractOutputLayer } from "../../../shared/helpersForCommands";
import { generateWikidataOutputLayer } from "../../../shared/sources/wikidata";

export const extractOutputLayer = generateExtractOutputLayer({
  source: "wikidata",
  generateOutputLayer: generateWikidataOutputLayer,
});

autoStartCommandIfNeeded(extractOutputLayer, __filename);
