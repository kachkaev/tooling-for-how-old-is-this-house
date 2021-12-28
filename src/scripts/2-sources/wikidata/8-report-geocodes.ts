import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateReportGeocodes } from "../../../shared/helpersForScripts";
import { generateWikidataOutputLayer } from "../../../shared/sources/wikidata";

const command = generateReportGeocodes({
  source: "wikidata",
  generateOutputLayer: generateWikidataOutputLayer,
});

autoStartCommandIfNeeded(command, __filename);

export default command;
