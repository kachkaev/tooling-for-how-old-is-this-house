import { generateExtractOutputLayer } from "../../../shared/helpersForScripts";
import { generateMkrfOutputLayer } from "../../../shared/sources/mkrf";

const script = generateExtractOutputLayer({
  canUseCollectedGeocodes: true,
  generateOutputLayer: generateMkrfOutputLayer,
  output: process.stdout,
  source: "mkrf",
});

await script();
