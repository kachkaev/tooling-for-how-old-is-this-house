import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateReportGeocodes } from "../../../shared/helpersForCommands";
import { generateMingkhOutputLayer } from "../../../shared/sources/mingkh";

export const reportGeocodes = generateReportGeocodes({
  source: "mingkh",
  generateOutputLayer: generateMingkhOutputLayer,
});

autoStartCommandIfNeeded(reportGeocodes, __filename);
