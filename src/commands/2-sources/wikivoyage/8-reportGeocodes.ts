import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateReportGeocodes } from "../../../shared/helpersForCommands";
import { generateWikiVoyageOutputLayer } from "../../../shared/sources/wikivoyage";

export const reportGeocodes = generateReportGeocodes({
  source: "wikivoyage",
  generateOutputLayer: generateWikiVoyageOutputLayer,
});

autoStartCommandIfNeeded(reportGeocodes, __filename);
