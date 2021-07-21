import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateReportGeocodes } from "../../../shared/helpersForCommands";
import { generateWikidataOutputLayer } from "../../../shared/sources/wikidata";

export const reportGeocodes = generateReportGeocodes({
  source: "wikidata",
  generateOutputLayer: generateWikidataOutputLayer,
});

autoStartCommandIfNeeded(reportGeocodes, __filename);
