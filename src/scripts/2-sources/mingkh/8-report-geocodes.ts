import { generateReportGeocodes } from "../../../shared/scripts";
import { generateMingkhOutputLayer } from "../../../shared/source-mingkh";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "mingkh",
  generateOutputLayer: generateMingkhOutputLayer,
});

await script();
