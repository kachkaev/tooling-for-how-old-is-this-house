import * as turf from "@turf/turf";
import chalk from "chalk";
import _ from "lodash";

export const addBufferToBbox = (
  bbox: turf.BBox,
  bufferInMeters: number,
): turf.BBox =>
  turf.bbox(
    turf.buffer(turf.bboxPolygon(bbox), bufferInMeters / 1000, {
      units: "kilometers",
      steps: 1,
    }),
  );

export const roughenBbox = (bbox: turf.BBox, precision: number): turf.BBox => {
  return [
    _.floor(bbox[0], precision),
    _.floor(bbox[1], precision),
    _.ceil(bbox[2], precision),
    _.ceil(bbox[3], precision),
  ];
};

/**
 * https://github.com/Turfjs/turf/issues/1900
 */
export const multiUnion = (
  thingsToUnion: Array<
    | turf.Feature<turf.Polygon | turf.MultiPolygon>
    | turf.Polygon
    | turf.MultiPolygon
  >,
): turf.Feature<turf.Polygon | turf.MultiPolygon> => {
  const [firstThing, ...remainingThings] = thingsToUnion;
  if (!firstThing) {
    throw new Error("Expected at least one feature or geometry, got none");
  }

  let result =
    firstThing.type === "Feature" ? firstThing : turf.feature(firstThing);

  for (const remainingThing of remainingThings) {
    result = turf.union(result, remainingThing);
  }

  return result;
};

export const filterFeaturesByGeometryType = <
  T extends turf.Feature<turf.GeometryObject, any>
>({
  features,
  acceptedGeometryTypes,
  logger,
}: {
  features: T[];
  acceptedGeometryTypes: turf.GeometryTypes[];
  logger?: Console;
}): T[] => {
  return features.filter((feature) => {
    if (acceptedGeometryTypes.includes(feature.geometry?.type)) {
      return true;
    }

    const featureId = feature.properties?.id;
    if (!feature.geometry) {
      logger?.log(
        chalk.yellow(`Ignoring feature ${featureId} without geometry`),
      );
    } else {
      logger?.log(
        chalk.yellow(
          `Ignoring feature ${featureId} due to unexpected geometry type: ${feature.geometry.type}`,
        ),
      );
    }

    return false;
  });
};
