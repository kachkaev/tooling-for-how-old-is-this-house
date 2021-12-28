import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateReportGeocodes } from "../../../shared/helpersForCommands";
import { generateWikivoyageOutputLayer } from "../../../shared/sources/wikivoyage";

const command = generateReportGeocodes({
  source: "wikivoyage",
  generateOutputLayer: generateWikivoyageOutputLayer,
});

autoStartCommandIfNeeded(command, __filename);

export default command;
