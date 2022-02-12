import { generateExtractOutputLayer } from "../../../shared/helpers-for-scripts";
import { generateWikidataOutputLayer } from "../../../shared/sources/wikidata";

const script = generateExtractOutputLayer({
  generateOutputLayer: generateWikidataOutputLayer,
  output: process.stdout,
  source: "wikidata",
});

await script();
