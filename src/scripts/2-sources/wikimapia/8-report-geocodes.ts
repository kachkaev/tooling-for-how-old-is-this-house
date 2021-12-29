import { generateReportGeocodes } from "../../../shared/helpersForScripts";
import { generateWikimapiaOutputLayer } from "../../../shared/sources/wikimapia";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "wikimapia",
  generateOutputLayer: generateWikimapiaOutputLayer,
});

script();
