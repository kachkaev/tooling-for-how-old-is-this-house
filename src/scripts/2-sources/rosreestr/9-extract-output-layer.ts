import { generateExtractOutputLayer } from "../../../shared/helpersForScripts";
import { generateRosreestrOutputLayer } from "../../../shared/sources/rosreestr";

const script = generateExtractOutputLayer({
  canUseCollectedGeocodes: true,
  generateOutputLayer: generateRosreestrOutputLayer,
  output: process.stdout,
  source: "rosreestr",
});

await script();
