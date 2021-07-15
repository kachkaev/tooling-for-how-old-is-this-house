import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateReportGeocodes } from "../../../shared/helpersForCommands";
import { generateWikivoyageOutputLayer } from "../../../shared/sources/wikivoyage";

export const reportGeocodes = generateReportGeocodes({
  source: "wikivoyage",
  generateOutputLayer: generateWikivoyageOutputLayer,
});

autoStartCommandIfNeeded(reportGeocodes, __filename);
