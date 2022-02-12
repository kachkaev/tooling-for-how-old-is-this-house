import { generateReportGeocodes } from "../../../shared/helpers-for-scripts";
import { generateWikimapiaOutputLayer } from "../../../shared/sources/wikimapia";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "wikimapia",
  generateOutputLayer: generateWikimapiaOutputLayer,
});

await script();
