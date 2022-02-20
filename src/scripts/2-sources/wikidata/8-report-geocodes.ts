import { generateReportGeocodes } from "../../../shared/helpers-for-scripts";
import { generateWikidataOutputLayer } from "../../../shared/source-wikidata";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "wikidata",
  generateOutputLayer: generateWikidataOutputLayer,
});

await script();
