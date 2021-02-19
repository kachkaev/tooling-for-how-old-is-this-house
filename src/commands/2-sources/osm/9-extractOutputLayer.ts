import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateExtractOutputLayer } from "../../../shared/helpersForCommands";
import { generateOsmOutputLayer } from "../../../shared/sources/osm";

export const extractOutputLayer = generateExtractOutputLayer({
  source: "osm",
  generateOutputLayer: generateOsmOutputLayer,
});

autoStartCommandIfNeeded(extractOutputLayer, __filename);
