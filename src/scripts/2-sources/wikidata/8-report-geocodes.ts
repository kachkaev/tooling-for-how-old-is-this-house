import { generateReportGeocodes } from "../../../shared/helpers-for-scripts";
import { generateWikidataOutputLayer } from "../../../shared/sources/wikidata";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "wikidata",
  generateOutputLayer: generateWikidataOutputLayer,
});

await script();
