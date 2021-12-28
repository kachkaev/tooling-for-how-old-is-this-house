import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateExtractOutputLayer } from "../../../shared/helpersForCommands";
import { generateOsmOutputLayer } from "../../../shared/sources/osm";

const command = generateExtractOutputLayer({
  source: "osm",
  generateOutputLayer: generateOsmOutputLayer,
});

autoStartCommandIfNeeded(command, __filename);

export default command;
