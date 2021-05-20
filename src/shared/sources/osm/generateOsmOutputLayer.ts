import { CommandError } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

import { deepClean } from "../../deepClean";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
} from "../../outputLayers";
import { getTerritoryExtent } from "../../territory";
import { getOsmDirPath } from "./helpersForPaths";
import { readFetchedOsmFeatureCollection } from "./readFetchedOsmFeatureCollection";
import { OsmFeature } from "./types";

type IntersectorFunction = (feature: turf.Feature) => string | undefined;
const generateGetIntersectedBoundaryName = ({
  boundaryFeatures,
  expectedBoundaryOfAllCheckedFeatures,
}: {
  boundaryFeatures: OsmFeature[];
  expectedBoundaryOfAllCheckedFeatures: turf.Feature<
    turf.Polygon | turf.MultiPolygon
  >;
}): IntersectorFunction => {
  const filteredBoundaryFeatures = boundaryFeatures.filter((feature) => {
    return (
      feature.properties.name &&
      !turf.booleanDisjoint(expectedBoundaryOfAllCheckedFeatures, feature)
    );
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

export const generateOsmOutputLayer: GenerateOutputLayer = async ({
  logger,
}): Promise<OutputLayer> => {
  const territoryExtent = await getTerritoryExtent();

  const buildingCollection = await readFetchedOsmFeatureCollection("buildings");

  const regionBoundaryCollection = await readFetchedOsmFeatureCollection(
    "boundaries-for-regions",
  );

  const settlementBoundaryCollection = await readFetchedOsmFeatureCollection(
    "boundaries-for-settlements",
  );

  // TODO: Remove after 2021-08-01. Related commit: 1b8504fd
  const legacyBoundaryPath = path.resolve(
    getOsmDirPath(),
    "fetched-boundaries.geojson",
  );
  if (await fs.pathExists(legacyBoundaryPath)) {
    throw new CommandError(
      `Please delete ${legacyBoundaryPath}. This file is no longer needed and may cause confusion.`,
    );
  }

  const getRegion = generateGetIntersectedBoundaryName({
    boundaryFeatures: regionBoundaryCollection.features,
    expectedBoundaryOfAllCheckedFeatures: territoryExtent,
  });

  const getSettlement = generateGetIntersectedBoundaryName({
    boundaryFeatures: settlementBoundaryCollection.features,
    expectedBoundaryOfAllCheckedFeatures: territoryExtent,
  });

  const generateAddress = (building: OsmFeature): string | undefined => {
    const streetOrPlace =
      building.properties["addr:street"] ?? building.properties["addr:place"];

    const houseNumber = building.properties["addr:housenumber"];

    if (!streetOrPlace || !houseNumber) {
      return undefined;
    }

    const region = getRegion(building);
    if (!region) {
      logger?.log(
        chalk.yellow(
          `Unable to find region for https://www.openstreetmap.org/${building.properties.id}`,
        ),
      );

      return undefined;
    }

    const settlement =
      building.properties["addr:city"] ?? getSettlement(building);
    if (!settlement) {
      logger?.log(
        chalk.yellow(
          `Unable to find settlement (city / town / village) for https://www.openstreetmap.org/${building.properties.id}`,
        ),
      );

      return undefined;
    }

    return [region, settlement, streetOrPlace, houseNumber].join(", ");
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
        address: generateAddress(building),
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
