import { generateExtractOutputLayer } from "../../../shared/scripts";
import { generateWikidataOutputLayer } from "../../../shared/source-wikidata";

const script = generateExtractOutputLayer({
  generateOutputLayer: generateWikidataOutputLayer,
  output: process.stdout,
  source: "wikidata",
});

await script();
