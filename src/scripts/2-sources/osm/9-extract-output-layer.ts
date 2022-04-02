import { generateExtractOutputLayer } from "../../../shared/scripts";
import { generateOsmOutputLayer } from "../../../shared/source-osm";

const script = generateExtractOutputLayer({
  output: process.stdout,
  source: "osm",
  generateOutputLayer: generateOsmOutputLayer,
});

await script();
