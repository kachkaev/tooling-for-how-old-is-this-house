import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateReportGeocodes } from "../../../shared/helpersForCommands";
import { generateRosreestrOutputLayer } from "../../../shared/sources/rosreestr";

export const reportGeocodes = generateReportGeocodes({
  source: "rosreestr",
  generateOutputLayer: generateRosreestrOutputLayer,
});

autoStartCommandIfNeeded(reportGeocodes, __filename);
