import rewind from "@mapbox/geojson-rewind";
import * as turf from "@turf/turf";
import chalk from "chalk";
import _ from "lodash";
import { WriteStream } from "node:tty";

export type Point2dCoordinates = [lon: number, lat: number];

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

export const deriveBboxCenter = (bbox: turf.BBox): Point2dCoordinates => {
  return [bbox[0] + (bbox[2] - bbox[0]) / 2, bbox[1] + (bbox[3] - bbox[1]) / 2];
};

export const createBboxFeature = (feature: turf.Feature, bufferInMeters = 0) =>
  rewind(
    turf.bboxPolygon(addBufferToBbox(turf.bbox(feature), bufferInMeters)),
    true,
  );

/**
 * Note that the inclusion is:
 *
 * [xmin, xmax)
 * [ymin, ymax)
 */
export const isPointInBbox = (
  point: Point2dCoordinates | number[],
  bbox: turf.BBox,
): boolean =>
  bbox[0] <= point[0] &&
  bbox[1] <= point[1] &&
  bbox[2] > point[0] &&
  bbox[3] > point[1];

export const unionBboxes = (bboxA: turf.BBox, bboxB: turf.BBox): turf.BBox => [
  Math.min(bboxA[0], bboxB[0]),
  Math.min(bboxA[1], bboxB[1]),
  Math.max(bboxA[2], bboxB[2]),
  Math.max(bboxA[3], bboxB[3]),
];

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
    const newResult = turf.union(result, remainingThing);
    if (newResult) {
      result = newResult;
    }
  }

  return result;
};

export const filterFeaturesByGeometryType = <
  T extends turf.Feature<
    turf.GeometryObject | undefined,
    Record<string, unknown>
  >,
>({
  features,
  acceptedGeometryTypes,
  output,
}: {
  features: T[];
  acceptedGeometryTypes: turf.GeometryTypes[];
  output?: WriteStream | undefined;
}): T[] => {
  return features.filter((feature) => {
    if (
      feature.geometry &&
      acceptedGeometryTypes.includes(feature.geometry.type)
    ) {
      return true;
    }

    const featureIdToDisplay =
      typeof feature.properties["id"] === "string" ||
      typeof feature.properties["id"] === "number"
        ? feature.properties["id"]
        : "<no id>";

    if (!feature.geometry) {
      output?.write(
        chalk.yellow(
          `Ignoring feature ${featureIdToDisplay} without geometry\n`,
        ),
      );
    } else {
      output?.write(
        chalk.yellow(
          `Ignoring feature ${featureIdToDisplay} due to unexpected geometry type: ${feature.geometry.type}\n`,
        ),
      );
    }

    return false;
  });
};

type MaybeFeature<T extends turf.Geometry> = T | turf.Feature<T>;

/**
 * Returns distance in meters (negative values for points inside) from a point to the edges of a polygon
 * Copied from https://github.com/Turfjs/turf/issues/1743#issuecomment-736805738
 */
export const calculatePointDistanceToPolygonInMeters = (
  point: MaybeFeature<turf.Point>,
  polygonFeatureOrGeometry: MaybeFeature<turf.Polygon | turf.MultiPolygon>,
) => {
  const polygon =
    polygonFeatureOrGeometry.type === "Feature"
      ? polygonFeatureOrGeometry.geometry
      : polygonFeatureOrGeometry;

  let distance: number;
  if (polygon.type === "MultiPolygon") {
    distance = polygon.coordinates
      .map((coords) =>
        calculatePointDistanceToPolygonInMeters(
          point,
          turf.polygon(coords).geometry,
        ),
      )
      // eslint-disable-next-line unicorn/no-array-reduce
      .reduce((smallest, current) => (current < smallest ? current : smallest));
  } else {
    if (polygon.coordinates.length > 1) {
      // Has holes
      const [exteriorDistance, ...interiorDistances] = polygon.coordinates.map(
        (coords) =>
          calculatePointDistanceToPolygonInMeters(
            point,
            turf.polygon([coords]).geometry,
          ),
      ) as [number, ...number[]];
      if (typeof exteriorDistance === "number" && exteriorDistance < 0) {
        // point is inside the exterior polygon shape
        // eslint-disable-next-line unicorn/no-array-reduce
        const smallestInteriorDistance = interiorDistances.reduce(
          (smallest, current) => (current < smallest ? current : smallest),
        );
        if (smallestInteriorDistance < 0) {
          // point is inside one of the holes (therefore not actually inside this shape)
          distance = smallestInteriorDistance * -1;
        } else {
          // find which is closer, the distance to the hole or the distance to the edge of the exterior, and set that as the inner distance.
          distance =
            smallestInteriorDistance < exteriorDistance * -1
              ? smallestInteriorDistance * -1
              : exteriorDistance;
        }
      } else {
        distance = exteriorDistance;
      }
    } else {
      const lineString = turf.polygonToLineString(polygon);
      if (lineString.type !== "Feature") {
        throw new Error(
          `Expected lineString.type to be Feature, got ${lineString.type}`,
        );
      }

      const lineStringGeometry = lineString.geometry;
      if (lineStringGeometry.type !== "LineString") {
        throw new Error(
          `Expected lineStringGeometry.type to be LineString, got  ${lineStringGeometry.type}`,
        );
      }

      // The actual distance operation - on a normal, hole-less polygon (converted to meters)
      distance = turf.pointToLineDistance(point, lineStringGeometry) * 1000;
      if (turf.booleanPointInPolygon(point, polygon)) {
        distance = distance * -1;
      }
    }
  }

  return distance;
};
