import * as turf from "@turf/turf";
import _ from "lodash";

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
      const point = turf.pointOnFeature(
        feature as turf.Feature<OutputLayerGeometry>,
      );

      reportedGeocodes.push({
        address,
        coordinates: point.geometry.coordinates.map((coordinate) =>
          _.round(coordinate, 6),
        ) as [number, number],
        weight: turf.area(feature),
      });
    } else {
      reportedGeocodes.push({ address });
    }
  }

  await reportGeocodes({
    logger,
    reportedGeocodes,
    source,
  });
};
