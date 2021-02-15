import * as turf from "@turf/turf";
import fs from "fs-extra";
import _ from "lodash";

import { OutputLayer } from "../../output";
import { getRegionExtent } from "../../region";
import { getFetchedOsmBuildingsFilePath } from "./helpersForPaths";

type IntersectorFunction = (feature: turf.Feature) => string;
const generateIntersector = ({
  boundaryFeatures,
  boundaryFeatureFilter,
  expectedBoundaryOfAllCheckedFeatures,
}: {
  boundaryFeatures: Array<turf.Feature<turf.Polygon | turf.MultiPolygon>>;
  boundaryFeatureFilter: (feature: turf.Feature) => boolean;
  expectedBoundaryOfAllCheckedFeatures: turf.Feature<
    turf.Polygon | turf.MultiPolygon
  >;
}): IntersectorFunction => {
  const filteredBoundaryFeatures = boundaryFeatures.filter((feature) => {
    return boundaryFeatureFilter(feature) && feature?.properties?.name;
  });

  if (
    filteredBoundaryFeatures.length === 1 &&
    turf.booleanContains(
      filteredBoundaryFeatures[0]!.geometry,
      expectedBoundaryOfAllCheckedFeatures,
    )
  ) {
    return () => filteredBoundaryFeatures[0]?.properties?.name;
  }

  const orderedBoundaryFeatures = _.orderBy(
    filteredBoundaryFeatures,
    (boundaryFeature) => turf.area(boundaryFeature.geometry),
    "desc",
  );

  return (feature: turf.Feature) =>
    orderedBoundaryFeatures.find((boundaryFeature) =>
      turf.booleanOverlap(boundaryFeature, feature),
    )?.properties?.name;
};

export const generateOsmOutputLayer = async ({
  logger,
}: {
  logger?: Console;
}): Promise<OutputLayer> => {
  const regionExtent = await getRegionExtent();

  const buildingCollection = (await fs.readJson(
    getFetchedOsmBuildingsFilePath(),
  )) as turf.FeatureCollection<turf.Polygon | turf.MultiPolygon>;

  const boundaryCollection = (await fs.readJson(
    getFetchedOsmBuildingsFilePath(),
  )) as turf.FeatureCollection<turf.Polygon | turf.MultiPolygon>;

  const getFederalSubjectName = generateIntersector({
    boundaryFeatures: boundaryCollection.features,
    boundaryFeatureFilter: (feature) =>
      feature.properties?.["admin_level"] === "4",
    expectedBoundaryOfAllCheckedFeatures: regionExtent,
  });

  const getPlaceName = generateIntersector({
    boundaryFeatures: boundaryCollection.features,
    boundaryFeatureFilter: (feature) => feature.properties?.["place"],
    expectedBoundaryOfAllCheckedFeatures: regionExtent,
  });

  logger?.log({ buildingCollection, getFederalSubjectName, getPlaceName });

  return turf.featureCollection([]);
};
