import * as turf from "@turf/turf";
import chalk from "chalk";

import { ReportedGeocode, reportGeocodes } from "../geocoding";
import { OutputLayer, OutputLayerGeometry } from "./types";

export const reportGeocodesInOutputLayer = async ({
  source,
  logger,
  outputLayer,
}: {
  logger: Console;
  source: string;
  outputLayer: OutputLayer;
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

  if (!reportedGeocodes.length) {
    logger.log(
      chalk.blue(
        `There are no geocodes to report. This is because none of the ${source} features have ‘address’ property.`,
      ),
    );

    return;
  }

  await reportGeocodes({
    logger,
    reportedGeocodes,
    source,
  });
};
