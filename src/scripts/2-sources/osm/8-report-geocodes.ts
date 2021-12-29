import { generateReportGeocodes } from "../../../shared/helpersForScripts";
import { generateOsmOutputLayer } from "../../../shared/sources/osm";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "osm",
  generateOutputLayer: generateOsmOutputLayer,
});

await script();
