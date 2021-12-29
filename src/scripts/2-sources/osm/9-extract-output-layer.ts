import { generateExtractOutputLayer } from "../../../shared/helpersForScripts";
import { generateOsmOutputLayer } from "../../../shared/sources/osm";

const script = generateExtractOutputLayer({
  output: process.stdout,
  source: "osm",
  generateOutputLayer: generateOsmOutputLayer,
});

await script();
