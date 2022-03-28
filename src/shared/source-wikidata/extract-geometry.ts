import * as turf from "@turf/turf";

import { WikidataQueryItem } from "./types";

/**
 * Converts "Point(lon, lat)" to Point geometry
 */
const parseCoordinateLocation = (serializedPoint: string): turf.Point => {
  const [, lonMatch, latMatch] =
    serializedPoint.match(/^Point\(([\d.-]+) ([\d.-]+)\)$/) ?? [];
  if (!lonMatch || !latMatch) {
    throw new Error(`Unable to parse "${serializedPoint}" as point geometry`);
  }

  return {
    type: "Point",
    coordinates: [Number.parseFloat(lonMatch), Number.parseFloat(latMatch)],
  };
};

export const extractGeometry = (item: WikidataQueryItem): turf.Point =>
  parseCoordinateLocation(item.coordinateLocation.value);
