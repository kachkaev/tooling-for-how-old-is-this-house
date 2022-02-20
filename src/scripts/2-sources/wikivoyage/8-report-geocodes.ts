import { generateReportGeocodes } from "../../../shared/scripts";
import { generateWikivoyageOutputLayer } from "../../../shared/source-wikivoyage";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "wikivoyage",
  generateOutputLayer: generateWikivoyageOutputLayer,
});

await script();
