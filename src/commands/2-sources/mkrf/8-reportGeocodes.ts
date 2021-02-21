import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateReportGeocodes } from "../../../shared/helpersForCommands";
import { generateMkrfOutputLayer } from "../../../shared/sources/mkrf";

export const reportGeocodes = generateReportGeocodes({
  source: "mkrf",
  generateOutputLayer: generateMkrfOutputLayer,
});

autoStartCommandIfNeeded(reportGeocodes, __filename);
