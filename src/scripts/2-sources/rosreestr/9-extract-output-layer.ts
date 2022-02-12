import { generateExtractOutputLayer } from "../../../shared/helpers-for-scripts";
import { generateRosreestrOutputLayer } from "../../../shared/sources/rosreestr";

const script = generateExtractOutputLayer({
  canUseCollectedGeocodes: true,
  generateOutputLayer: generateRosreestrOutputLayer,
  output: process.stdout,
  source: "rosreestr",
});

await script();
