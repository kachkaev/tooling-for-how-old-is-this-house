import { generateReportGeocodes } from "../../../shared/helpersForScripts";
import { generateRosreestrOutputLayer } from "../../../shared/sources/rosreestr";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "rosreestr",
  generateOutputLayer: generateRosreestrOutputLayer,
});

script();
