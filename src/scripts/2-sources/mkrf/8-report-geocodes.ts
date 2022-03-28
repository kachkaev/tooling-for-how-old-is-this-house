import { generateReportGeocodes } from "../../../shared/scripts";
import { generateMkrfOutputLayer } from "../../../shared/source-mkrf";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "mkrf",
  generateOutputLayer: generateMkrfOutputLayer,
});

await script();
