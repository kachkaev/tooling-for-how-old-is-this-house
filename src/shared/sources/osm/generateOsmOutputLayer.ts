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
import { extractYearFromCompletionDates } from "../../completionDates";
import { deepClean } from "../../deepClean";
import { OutputLayer, OutputLayerProperties } from "../../output";
import { getTerritoryExtent } from "../../territory";
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
  fetchedOsmBuildingsFilePath = getFetchedOsmBuildingsFilePath(),
  fetchedOsmBoundariesFilePath = getFetchedOsmBoundariesFilePath(),
}: {
  logger?: Console;
  fetchedOsmBuildingsFilePath?: string;
  fetchedOsmBoundariesFilePath?: string;
}): Promise<OutputLayer> => {
  const territoryExtent = await getTerritoryExtent();

  const buildingCollection = (await fs.readJson(
    fetchedOsmBuildingsFilePath,
  )) as OsmFeatureCollection;

  const boundaryCollection = (await fs.readJson(
    fetchedOsmBoundariesFilePath,
  )) as OsmFeatureCollection;

  const getFederalSubjectName = generateGetIntersectedBoundaryName({
    boundaryFeatures: boundaryCollection.features,
    boundaryFeatureFilter: (feature) =>
      feature.properties?.["admin_level"] === "4",
    expectedBoundaryOfAllCheckedFeatures: territoryExtent,
  });

  const getPlaceName = generateGetIntersectedBoundaryName({
    boundaryFeatures: boundaryCollection.features,
    boundaryFeatureFilter: (feature) => feature.properties?.["place"],
    expectedBoundaryOfAllCheckedFeatures: territoryExtent,
  });

  const generateNormalizedAddress = (
    building: OsmFeature,
  ): string | undefined => {
    const streetName =
      building.properties["addr:street"] ?? building.properties["addr:place"];
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
      const buildingTagValue = building.properties["abandoned"]
        ? "abandoned"
        : building.properties["building"];
      const buildingType =
        buildingTagValue && buildingTagValue !== "yes"
          ? buildingTagValue
          : undefined;

      const outputLayerProperties: OutputLayerProperties = {
        id: building.properties.id,
        buildingType,
        completionDates: building.properties["start_date"],
        completionYear: extractYearFromCompletionDates(
          building.properties["start_date"],
        ),
        normalizedAddress: generateNormalizedAddress(building),
        knownAt: buildingCollection.fetchedAt,
      };

      return turf.feature(building.geometry, deepClean(outputLayerProperties));
    },
  );

  return {
    type: "FeatureCollection",
    knownAt: buildingCollection.fetchedAt,
    layerRole: "base",
    features: outputFeatures,
  };
};
