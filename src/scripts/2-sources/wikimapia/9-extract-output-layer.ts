import { generateExtractOutputLayer } from "../../../shared/helpers-for-scripts";
import { generateWikimapiaOutputLayer } from "../../../shared/source-wikimapia";

const script = generateExtractOutputLayer({
  generateOutputLayer: generateWikimapiaOutputLayer,
  output: process.stdout,
  source: "wikimapia",
});

await script();
