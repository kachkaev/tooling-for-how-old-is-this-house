import { generateReportGeocodes } from "../../../shared/scripts";
import { generateRosreestrOutputLayer } from "../../../shared/source-rosreestr";

const script = generateReportGeocodes({
  output: process.stdout,
  source: "rosreestr",
  generateOutputLayer: generateRosreestrOutputLayer,
});

await script();
