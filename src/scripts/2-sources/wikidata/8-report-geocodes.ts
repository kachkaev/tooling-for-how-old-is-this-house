import { generateReportGeocodes } from "../../../shared/helpersForScripts";
import { generateWikidataOutputLayer } from "../../../shared/sources/wikidata";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "wikidata",
  generateOutputLayer: generateWikidataOutputLayer,
});

await script();
