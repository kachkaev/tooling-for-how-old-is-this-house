import { generateExtractOutputLayer } from "../../../shared/helpersForScripts";
import { generateWikimapiaOutputLayer } from "../../../shared/sources/wikimapia";

const script = generateExtractOutputLayer({
  generateOutputLayer: generateWikimapiaOutputLayer,
  output: process.stdout,
  source: "wikimapia",
});

await script();
