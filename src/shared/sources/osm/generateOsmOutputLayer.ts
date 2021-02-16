import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";

import {
  combineAddressParts,
  normalizeAddressPart,
  normalizeBuilding,
  normalizeStreet,
} from "../../addresses";
import { deepClean } from "../../deepClean";
import { OutputLayer, OutputLayerProperties } from "../../output";
import { extractYearFromDates } from "../../output/parseYear";
import { getRegionExtent } from "../../region";
import {
  getFetchedOsmBoundariesFilePath,
  getFetchedOsmBuildingsFilePath,
} from "./helpersForPaths";
import { OsmFeature, OsmFeatureCollection } from "./types";

type IntersectorFunction = (feature: turf.Feature) => string | undefined;
const generateGetIntersectedBoundaryName = ({
  boundaryFeatures,
  boundaryFeatureFilter,
  expectedBoundaryOfAllCheckedFeatures,
}: {
  boundaryFeatures: OsmFeature[];
  boundaryFeatureFilter: (feature: turf.Feature) => boolean;
  expectedBoundaryOfAllCheckedFeatures: turf.Feature<
    turf.Polygon | turf.MultiPolygon
  >;
}): IntersectorFunction => {
  const filteredBoundaryFeatures = boundaryFeatures.filter((feature) => {
    return boundaryFeatureFilter(feature) && feature?.properties.name;
  });

  if (filteredBoundaryFeatures.length === 1) {
    const boundaryFeature = filteredBoundaryFeatures[0]!;
    const polygonsToCheck =
      boundaryFeature.geometry.type === "MultiPolygon"
        ? boundaryFeature.geometry.coordinates.map((part) => turf.polygon(part))
        : [boundaryFeature as turf.Feature<turf.Polygon>];

    for (const polygonToCheck of polygonsToCheck) {
      if (
        turf.booleanContains(
          polygonToCheck,
          expectedBoundaryOfAllCheckedFeatures,
        )
      ) {
        return () => filteredBoundaryFeatures[0]?.properties.name;
      }
    }
  }

  const orderedBoundaryFeatures = _.orderBy(
    filteredBoundaryFeatures,
    (boundaryFeature) => turf.area(boundaryFeature.geometry),
    "desc",
  );

  return (feature: turf.Feature) =>
    orderedBoundaryFeatures.find(
      (boundaryFeature) => !turf.booleanDisjoint(boundaryFeature, feature), // https://github.com/Turfjs/turf/issues/2034
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
  )) as OsmFeatureCollection;

  const boundaryCollection = (await fs.readJson(
    getFetchedOsmBoundariesFilePath(),
  )) as OsmFeatureCollection;

  const getFederalSubjectName = generateGetIntersectedBoundaryName({
    boundaryFeatures: boundaryCollection.features,
    boundaryFeatureFilter: (feature) =>
      feature.properties?.["admin_level"] === "4",
    expectedBoundaryOfAllCheckedFeatures: regionExtent,
  });

  const getPlaceName = generateGetIntersectedBoundaryName({
    boundaryFeatures: boundaryCollection.features,
    boundaryFeatureFilter: (feature) => feature.properties?.["place"],
    expectedBoundaryOfAllCheckedFeatures: regionExtent,
  });

  const generateNormalizedAddress = (
    building: OsmFeature,
  ): string | undefined => {
    const streetName = building.properties["addr:street"];
    const houseNumber = building.properties["addr:housenumber"];
    if (!streetName || !houseNumber) {
      return undefined;
    }
    const federalSubjectName = getFederalSubjectName(building);
    if (!federalSubjectName) {
      logger?.log(
        chalk.yellow(
          `Unable to find federal subject for ${building.properties.id}`,
        ),
      );

      return undefined;
    }
    const placeName = getPlaceName(building);
    if (!placeName) {
      logger?.log(
        chalk.yellow(
          `Unable to find place (city / town / village) for ${building.properties.id}`,
        ),
      );

      return undefined;
    }

    return combineAddressParts([
      normalizeAddressPart(federalSubjectName),
      normalizeAddressPart(placeName),
      normalizeStreet(streetName),
      normalizeBuilding(houseNumber),
    ]);
  };

  const outputFeatures: OutputLayer["features"] = buildingCollection.features.map(
    (building) => {
      const outputLayerProperties: OutputLayerProperties = {
        id: building.properties.id,
        completionDates: building.properties["start_date"],
        completionYear: extractYearFromDates(building.properties["start_date"]),
        normalizedAddress: generateNormalizedAddress(building),
      };

      return turf.feature(building.geometry, deepClean(outputLayerProperties));
    },
  );
  // logger?.log({ buildingCollection, getFederalSubjectName, getPlaceName });

  return turf.featureCollection(outputFeatures);
};
