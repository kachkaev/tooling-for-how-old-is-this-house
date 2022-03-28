import { generateExtractOutputLayer } from "../../../shared/scripts";
import { generateRosreestrOutputLayer } from "../../../shared/source-rosreestr";

const script = generateExtractOutputLayer({
  canUseCollectedGeocodes: true,
  generateOutputLayer: generateRosreestrOutputLayer,
  output: process.stdout,
  source: "rosreestr",
});

await script();
