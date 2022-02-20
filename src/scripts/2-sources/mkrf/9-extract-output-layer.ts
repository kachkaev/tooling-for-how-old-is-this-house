import { generateExtractOutputLayer } from "../../../shared/helpers-for-scripts";
import { generateMkrfOutputLayer } from "../../../shared/source-mkrf";

const script = generateExtractOutputLayer({
  canUseCollectedGeocodes: true,
  generateOutputLayer: generateMkrfOutputLayer,
  output: process.stdout,
  source: "mkrf",
});

await script();
