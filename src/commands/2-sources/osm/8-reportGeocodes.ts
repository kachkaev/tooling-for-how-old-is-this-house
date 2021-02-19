import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateReportGeocodes } from "../../../shared/helpersForCommands";
import { generateOsmOutputLayer } from "../../../shared/sources/osm";

export const reportGeocodes = generateReportGeocodes({
  source: "osm",
  generateOutputLayer: generateOsmOutputLayer,
});

autoStartCommandIfNeeded(reportGeocodes, __filename);
