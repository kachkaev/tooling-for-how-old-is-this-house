import { generateReportGeocodes } from "../../../shared/helpersForScripts";
import { generateMkrfOutputLayer } from "../../../shared/sources/mkrf";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "mkrf",
  generateOutputLayer: generateMkrfOutputLayer,
});

script();
