import { CommandError } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

import { deepClean } from "../../deepClean";
import { TrivialName } from "../../helpersForNames";
import { normalizeSpacing } from "../../normalizeSpacing";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
} from "../../outputLayers";
import { getTerritoryExtent } from "../../territory";
import { getOsmDirPath } from "./helpersForPaths";
import { readFetchedOsmFeatureCollection } from "./readFetchedOsmFeatureCollection";
import { OsmFeature, OsmFeatureProperties } from "./types";

const buildWikidataUrl = (
  wikidataId: string | undefined,
): string | undefined => {
  if (!wikidataId) {
    return undefined;
  }

  return `http://www.wikidata.org/entity/${wikidataId}`;
};

const extractPhoto = (
  building: OsmFeature,
):
  | Pick<
      OutputLayerProperties,
      "photoUrl" | "photoAuthorName" | "photoAuthorUrl"
    >
  | undefined => {
  const wikimediaCommons = building.properties["wikimedia_commons"];
  if (wikimediaCommons?.startsWith("File:")) {
    return {
      photoUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
        decodeURIComponent(wikimediaCommons).replace("File:", ""),
      )}?width=1000`,
      photoAuthorName: "Wikimedia Commons",
      photoAuthorUrl: "https://commons.wikimedia.org",
    };
  }

  const image = building.properties["image"];
  try {
    const parsedImageUrl = new URL(image ?? "");
    const { host } = parsedImageUrl;

    return {
      photoUrl: parsedImageUrl.toString(),
      photoAuthorUrl: host.match(/\.*.userapi.com$/) ? "ВК" : host,
    };
  } catch {
    // noop
  }

  // Support more photo sources?
  // https://wiki.openstreetmap.org/wiki/Photo_linking

  return undefined;
};

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

  return `https://${languageSubdomain}.wikipedia.org/wiki/${encodeURIComponent(
    articleName,
  )}`;
};

const deriveFloorCountAboveGroundFromBuildingTag = (
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

// https://wiki.openstreetmap.org/wiki/Key:start_date
const processStartDate = (startDate: string | undefined) => {
  const result = normalizeSpacing(startDate ?? "")
    .toLowerCase()
    .replace(/^before /, "до ");

  if (!result) {
    return undefined;
  }

  return result;
};

// https://wiki.openstreetmap.org/wiki/Key:amenity
// https://wiki.openstreetmap.org/wiki/Key:building
// https://wiki.openstreetmap.org/wiki/Key:leisure
const trivialNameByTagValue: Record<string, TrivialName> = {
  /* eslint-disable @typescript-eslint/naming-convention */
  abandoned: "заброшенное здание",
  apartments: "жилой дом",
  bar: "бар",
  barn: "хранилище",
  cafe: "кафе",
  cinema: "кинотеатр",
  community_centre: "центр культурного развития",
  construction: "строящийся объект",
  container: "контейнер",
  detached: "жилой дом",
  dormitory: "общежитие",
  fire_station: "пожарная станция",
  fitness_centre: "спортивный зал",
  fuel: "АЗС",
  garage: "гараж",
  garages: "гаражи",
  gazebo: "беседка",
  grandstand: "трибуна",
  greenhouse: "теплица",
  gym: "спортивный зал",
  hospital: "медицинский корпус",
  hotel: "гостиница",
  house: "жилой дом",
  industrial: "промышленное здание",
  kiosk: "киоск",
  library: "библиотека",
  music_school: "музыкальная школа",
  office: "офисное здание",
  post_office: "почтовое отделение",
  reservoir: "резервуар",
  residential: "жилой дом",
  restaurant: "ресторан",
  roof: "навес",
  ruins: "разрушенный объект",
  semidetached_house: "жилой дом",
  shed: "сарай",
  sports_hall: "спортивный зал",
  stable: "конюшни",
  storage_tank: "резервуар",
  sty: "хлев",
  sub_station: "трансформаторная подстанция",
  supermarket: "супермаркет",
  swimming_pool: "бассейн",
  temple: "часовня",
  theatre: "театр",
  transformer_tower: "трансформаторная подстанция",
  university: "университетское здание",
  warehouse: "складское здание",
  water_tower: "водонапорная башня",
  /* eslint-enable @typescript-eslint/naming-convention */
};

const generateTrivialNameFromOsmTags = ({
  amenity,
  building,
  leisure,
  power,
}: OsmFeatureProperties): TrivialName | undefined =>
  trivialNameByTagValue[amenity ?? ""] ??
  trivialNameByTagValue[leisure ?? ""] ??
  trivialNameByTagValue[power ?? ""] ??
  trivialNameByTagValue[building ?? ""] ??
  undefined;

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

  const extractAddress = (
    building: OsmFeature,
  ): Pick<OutputLayerProperties, "address"> | undefined => {
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

    return {
      address: [region, settlement, fullStreetOrPlace, fullHouseNumber].join(
        ", ",
      ),
    };
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
        deriveFloorCountAboveGroundFromBuildingTag(
          building.properties["building"],
        ) ||
        undefined;
      const floorCountBelowGround =
        parseInt(building.properties["building:levels:underground"] ?? "") ||
        undefined;

      const url =
        building.properties["contact:website"] ??
        building.properties["website"];

      const wikidataUrl = buildWikidataUrl(building.properties["wikidata"]);
      const wikipediaUrl = buildWikipediaUrl(
        building.properties["wikipedia"] ?? building.properties["wikipedia:ru"],
      );

      const outputLayerProperties: OutputLayerProperties = {
        ...extractAddress(building),
        // TODO: Move more properties to ...extract*() patterns for better code readability and composability
        buildingType,
        completionDates: processStartDate(building.properties["start_date"]),
        floorCountAboveGround,
        floorCountBelowGround,
        id: building.properties.id,
        knownAt: buildingCollection.fetchedAt,
        name:
          building.properties["name"] ??
          generateTrivialNameFromOsmTags(building.properties),
        url,
        wikidataUrl,
        ...extractPhoto(building),
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
