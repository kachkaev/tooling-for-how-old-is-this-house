import { generateReportGeocodes } from "../../../shared/helpers-for-scripts";
import { generateMingkhOutputLayer } from "../../../shared/sources/mingkh";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "mingkh",
  generateOutputLayer: generateMingkhOutputLayer,
});

await script();
