import * as turf from "@turf/turf";

/**
 * Converts "Point(lon, lat)" to Point geometry
 */
export const parseCoordinateLocation = (
  serializedPoint: string,
): turf.Point => {
  const [, lonMatch, latMatch] =
    serializedPoint.match(/^Point\(([-\d.]+) ([-\d.]+)\)$/) ?? [];
  if (!lonMatch || !latMatch) {
    throw new Error(`Unable to parse "${serializedPoint}" as point geometry`);
  }

  return {
    type: "Point",
    coordinates: [parseFloat(lonMatch), parseFloat(latMatch)],
  };
};
