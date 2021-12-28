import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateReportGeocodes } from "../../../shared/helpersForScripts";
import { generateMkrfOutputLayer } from "../../../shared/sources/mkrf";

const command = generateReportGeocodes({
  source: "mkrf",
  generateOutputLayer: generateMkrfOutputLayer,
});

autoStartCommandIfNeeded(command, __filename);

export default command;
