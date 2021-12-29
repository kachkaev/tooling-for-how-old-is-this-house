import { generateReportGeocodes } from "../../../shared/helpersForScripts";
import { generateMingkhOutputLayer } from "../../../shared/sources/mingkh";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "mingkh",
  generateOutputLayer: generateMingkhOutputLayer,
});

script();
