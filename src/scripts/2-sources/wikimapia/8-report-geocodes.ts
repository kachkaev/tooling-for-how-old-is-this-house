import { generateReportGeocodes } from "../../../shared/scripts";
import { generateWikimapiaOutputLayer } from "../../../shared/source-wikimapia";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "wikimapia",
  generateOutputLayer: generateWikimapiaOutputLayer,
});

await script();
