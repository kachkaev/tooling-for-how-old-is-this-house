import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateReportGeocodes } from "../../../shared/helpersForScripts";
import { generateOsmOutputLayer } from "../../../shared/sources/osm";

const command = generateReportGeocodes({
  source: "osm",
  generateOutputLayer: generateOsmOutputLayer,
});

autoStartCommandIfNeeded(command, __filename);

export default command;
