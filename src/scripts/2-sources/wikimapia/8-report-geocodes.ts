import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateReportGeocodes } from "../../../shared/helpersForScripts";
import { generateWikimapiaOutputLayer } from "../../../shared/sources/wikimapia";

const command = generateReportGeocodes({
  source: "wikimapia",
  generateOutputLayer: generateWikimapiaOutputLayer,
});

autoStartCommandIfNeeded(command, __filename);

export default command;
