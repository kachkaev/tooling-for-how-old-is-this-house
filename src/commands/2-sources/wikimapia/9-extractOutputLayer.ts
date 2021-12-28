import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateExtractOutputLayer } from "../../../shared/helpersForCommands";
import { generateWikimapiaOutputLayer } from "../../../shared/sources/wikimapia";

const command = generateExtractOutputLayer({
  source: "wikimapia",
  generateOutputLayer: generateWikimapiaOutputLayer,
});

autoStartCommandIfNeeded(command, __filename);

export default command;
