import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateReportGeocodes } from "../../../shared/helpersForCommands";
import { generateWikimapiaOutputLayer } from "../../../shared/sources/wikimapia";

export const reportGeocodes = generateReportGeocodes({
  source: "wikimapia",
  generateOutputLayer: generateWikimapiaOutputLayer,
});

autoStartCommandIfNeeded(reportGeocodes, __filename);
