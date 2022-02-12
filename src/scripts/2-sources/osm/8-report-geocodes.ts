import { generateReportGeocodes } from "../../../shared/helpers-for-scripts";
import { generateOsmOutputLayer } from "../../../shared/sources/osm";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "osm",
  generateOutputLayer: generateOsmOutputLayer,
});

await script();
