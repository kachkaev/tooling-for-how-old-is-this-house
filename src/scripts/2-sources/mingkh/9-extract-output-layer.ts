import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateExtractOutputLayer } from "../../../shared/helpersForScripts";
import { generateMingkhOutputLayer } from "../../../shared/sources/mingkh";

const command = generateExtractOutputLayer({
  source: "mingkh",
  generateOutputLayer: generateMingkhOutputLayer,
});

autoStartCommandIfNeeded(command, __filename);

export default command;
