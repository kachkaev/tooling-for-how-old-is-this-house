import { generateExtractOutputLayer } from "../../../shared/helpers-for-scripts";
import { generateMingkhOutputLayer } from "../../../shared/sources/mingkh";

const script = generateExtractOutputLayer({
  output: process.stdout,
  source: "mingkh",
  generateOutputLayer: generateMingkhOutputLayer,
});

await script();
