import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateExtractOutputLayer } from "../../../shared/helpersForCommands";
import { generateRosreestrOutputLayer } from "../../../shared/sources/rosreestr";

const command = generateExtractOutputLayer({
  source: "rosreestr",
  generateOutputLayer: generateRosreestrOutputLayer,
  canUseCollectedGeocodes: true,
});

autoStartCommandIfNeeded(command, __filename);

export default command;
