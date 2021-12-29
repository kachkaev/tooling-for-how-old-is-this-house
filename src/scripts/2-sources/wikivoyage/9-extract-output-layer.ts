import { generateExtractOutputLayer } from "../../../shared/helpersForScripts";
import { generateWikivoyageOutputLayer } from "../../../shared/sources/wikivoyage";

const script = generateExtractOutputLayer({
  canUseCollectedGeocodes: true,
  generateOutputLayer: generateWikivoyageOutputLayer,
  output: process.stdout,
  source: "wikivoyage",
});

script();
