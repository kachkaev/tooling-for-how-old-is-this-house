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

const buildWikipediaUrl = (
  wikipediaTagValue: string | undefined,
  defaultLanguageSubdomain = "ru",
): string | undefined => {
  if (!wikipediaTagValue) {
    return undefined;
  }

  let articleName = wikipediaTagValue;
  let languageSubdomain = defaultLanguageSubdomain;
  if (wikipediaTagValue[2] === ":") {
    articleName = wikipediaTagValue.slice(3);
    languageSubdomain = wikipediaTagValue.slice(0, 2);
  }

  const articleSlug = articleName.replace(/ /g, "_");

  return `https://${languageSubdomain}.wikipedia.org/wiki/${articleSlug}`;
};

const deriveFloorCouuntAboveGroundFromBuildingTag = (
  buildingType: string | undefined,
): number | undefined => {
  switch (buildingType) {
    case "container":
    case "garage":
    case "garages":
    case "kiosk":
    case "service":
    case "shed":
      return 1;
  }

  return undefined;
};

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

    const streetOrPlace2 =
      building.properties["addr2:street"] ??
      building.properties["addr:street2"];
    const fullStreetOrPlace = streetOrPlace2
      ? `${streetOrPlace.split("/")[0]} / ${streetOrPlace2}`
      : streetOrPlace;

    const houseNumber2 =
      building.properties["addr2:housenumber"] ??
      building.properties["addr:housenumber2"];
    const fullHouseNumber = houseNumber2
      ? `${houseNumber.split("/")[0]}/${houseNumber2}`
      : houseNumber;

    return [region, settlement, fullStreetOrPlace, fullHouseNumber].join(", ");
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

      const floorCountAboveGround =
        parseInt(building.properties["building:levels"] ?? "") ||
        deriveFloorCouuntAboveGroundFromBuildingTag(
          building.properties["building"],
        ) ||
        undefined;
      const floorCountBelowGround =
        parseInt(building.properties["building:levels:underground"] ?? "") ||
        undefined;

      const url =
        building.properties["contact:website"] ??
        building.properties["website"];

      const wikipediaUrl = buildWikipediaUrl(
        building.properties["wikipedia"] ?? building.properties["wikipedia:ru"],
      );

      const outputLayerProperties: OutputLayerProperties = {
        address: generateAddress(building),
        buildingType,
        completionDates: building.properties["start_date"],
        floorCountAboveGround,
        floorCountBelowGround,
        id: building.properties.id,
        knownAt: buildingCollection.fetchedAt,
        name: building.properties["name"],
        url,
        wikipediaUrl,
      };

      // Simplify geometry to avoid redundant nodes from building parts and entrances
      const geometry = turf.truncate(
        turf.simplify(building.geometry, { tolerance: 0.000001 }),
        { precision: 6 },
      );

      return turf.feature(geometry, deepClean(outputLayerProperties));
    },
  );

  return {
    type: "FeatureCollection",
    knownAt: buildingCollection.fetchedAt,
    layerRole: "base",
    features: outputFeatures,
  };
};
