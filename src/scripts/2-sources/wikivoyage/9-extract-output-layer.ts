import { generateExtractOutputLayer } from "../../../shared/scripts";
import { generateWikivoyageOutputLayer } from "../../../shared/source-wikivoyage";

const script = generateExtractOutputLayer({
  canUseCollectedGeocodes: true,
  generateOutputLayer: generateWikivoyageOutputLayer,
  output: process.stdout,
  source: "wikivoyage",
});

await script();
