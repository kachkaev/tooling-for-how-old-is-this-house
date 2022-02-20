import { generateReportGeocodes } from "../../../shared/scripts";
import { generateOsmOutputLayer } from "../../../shared/source-osm";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "osm",
  generateOutputLayer: generateOsmOutputLayer,
});

await script();
