import { generateExtractOutputLayer } from "../../../shared/helpersForScripts";
import { generateMingkhOutputLayer } from "../../../shared/sources/mingkh";

const script = generateExtractOutputLayer({
  output: process.stdout,
  source: "mingkh",
  generateOutputLayer: generateMingkhOutputLayer,
});

await script();
