import { generateReportGeocodes } from "../../../shared/helpers-for-scripts";
import { generateRosreestrOutputLayer } from "../../../shared/sources/rosreestr";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "rosreestr",
  generateOutputLayer: generateRosreestrOutputLayer,
});

await script();
