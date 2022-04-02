import { generateExtractOutputLayer } from "../../../shared/scripts";
import { generateMingkhOutputLayer } from "../../../shared/source-mingkh";

const script = generateExtractOutputLayer({
  output: process.stdout,
  source: "mingkh",
  generateOutputLayer: generateMingkhOutputLayer,
});

await script();
