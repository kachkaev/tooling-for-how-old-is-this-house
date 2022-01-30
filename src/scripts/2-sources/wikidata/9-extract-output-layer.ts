import { generateExtractOutputLayer } from "../../../shared/helpersForScripts";
import { generateWikidataOutputLayer } from "../../../shared/sources/wikidata";

const script = generateExtractOutputLayer({
  generateOutputLayer: generateWikidataOutputLayer,
  output: process.stdout,
  source: "wikidata",
});

await script();
