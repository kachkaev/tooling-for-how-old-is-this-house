import { generateReportGeocodes } from "../../../shared/helpersForScripts";
import { generateWikivoyageOutputLayer } from "../../../shared/sources/wikivoyage";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "wikivoyage",
  generateOutputLayer: generateWikivoyageOutputLayer,
});

script();
