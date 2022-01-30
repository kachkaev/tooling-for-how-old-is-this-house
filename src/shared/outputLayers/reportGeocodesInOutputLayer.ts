import * as turf from "@turf/turf";
import chalk from "chalk";
import { WriteStream } from "node:tty";

import { ReportedGeocode, reportGeocodes } from "../geocoding";
import { OutputLayer, OutputLayerGeometry } from "./types";

export const reportGeocodesInOutputLayer = async ({
  output,
  outputLayer,
  source,
}: {
  output: WriteStream;
  outputLayer: OutputLayer;
  source: string;
}) => {
  const reportedGeocodes: ReportedGeocode[] = [];

  for (const feature of outputLayer.features) {
    const { address: address } = feature.properties;
    if (!address) {
      continue;
    }

    if (feature.geometry) {
      const point = turf.truncate(
        turf.pointOnFeature(feature as turf.Feature<OutputLayerGeometry>),
        { precision: 6 },
      );

      reportedGeocodes.push({
        address,
        coordinates: point.geometry.coordinates as [number, number],
        weight: turf.area(feature),
      });
    } else {
      reportedGeocodes.push({ address });
    }
  }

  if (reportedGeocodes.length === 0) {
    output.write(
      chalk.blue(
        `There are no geocodes to report. This is because none of the ${source} features have ‘address’ property.\n`,
      ),
    );

    // We assume that if there are no geocodes to report, the layer had no geocodes in the past as well.
    // If this assumption no longer holds true, we should remove the return statement to clean up the catalog.
    return;
  }

  await reportGeocodes({
    output,
    reportedGeocodes,
    source,
  });
};
