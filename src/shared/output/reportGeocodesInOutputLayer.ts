import * as turf from "@turf/turf";
import _ from "lodash";

import { ReportedGeocode, reportGeocodes } from "../geocoding";
import { OutputLayer, OutputLayerGeometry } from "./types";

type ReportedGeocodeWithArea = ReportedGeocode & { area: number };

export const reportGeocodesInOutputLayer = async ({
  source,
  logger,
  outputLayer,
  reportKnownAt,
}: {
  logger: Console;
  source: string;
  outputLayer: OutputLayer;
  reportKnownAt?: boolean;
}) => {
  const allReportedGeocodes: ReportedGeocodeWithArea[] = [];

  for (const feature of outputLayer.features) {
    const normalizedAddress = feature.properties.normalizedAddress;
    if (!normalizedAddress) {
      continue;
    }

    if (feature.geometry) {
      const point = turf.pointOnFeature(
        feature as turf.Feature<OutputLayerGeometry>,
      );
      const area = turf.area(feature);
      allReportedGeocodes.push({
        normalizedAddress,
        coordinates: point.geometry.coordinates.map((coordinate) =>
          _.round(coordinate, 6),
        ) as [number, number],
        knownAt: reportKnownAt ? feature.properties.knownAt : undefined,
        area,
      });
    } else {
      allReportedGeocodes.push({ normalizedAddress, area: 0 });
    }
  }

  // If there are two buildings with the same geocode, pick one with the largest area
  const reportedGeocodes = _.uniqBy(
    _.orderBy(allReportedGeocodes, (reportedGeocode) => -reportedGeocode.area),
    (reportedGeocode) => reportedGeocode.normalizedAddress,
  );

  await reportGeocodes({
    logger,
    reportedGeocodes,
    source,
  });
};
