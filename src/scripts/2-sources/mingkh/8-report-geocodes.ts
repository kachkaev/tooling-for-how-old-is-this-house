import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateReportGeocodes } from "../../../shared/helpersForScripts";
import { generateMingkhOutputLayer } from "../../../shared/sources/mingkh";

const command = generateReportGeocodes({
  source: "mingkh",
  generateOutputLayer: generateMingkhOutputLayer,
});

autoStartCommandIfNeeded(command, __filename);

export default command;
