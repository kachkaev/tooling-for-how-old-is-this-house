import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateExtractOutputLayer } from "../../../shared/helpersForScripts";
import { generateWikidataOutputLayer } from "../../../shared/sources/wikidata";

const command = generateExtractOutputLayer({
  source: "wikidata",
  generateOutputLayer: generateWikidataOutputLayer,
});

autoStartCommandIfNeeded(command, __filename);

export default command;
