import { generateReportGeocodes } from "../../../shared/helpers-for-scripts";
import { generateMkrfOutputLayer } from "../../../shared/sources/mkrf";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "mkrf",
  generateOutputLayer: generateMkrfOutputLayer,
});

await script();
