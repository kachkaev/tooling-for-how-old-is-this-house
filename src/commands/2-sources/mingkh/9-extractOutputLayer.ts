import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateExtractOutputLayer } from "../../../shared/helpersForCommands";
import { generateMingkhOutputLayer } from "../../../shared/sources/mingkh";

const command = generateExtractOutputLayer({
  source: "mingkh",
  generateOutputLayer: generateMingkhOutputLayer,
});

autoStartCommandIfNeeded(command, __filename);

export default command;
