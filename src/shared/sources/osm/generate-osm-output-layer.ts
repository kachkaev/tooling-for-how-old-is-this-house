import booleanIntersects from "@turf/boolean-intersects"; // https://github.com/Turfjs/turf/pull/2157
import * as turf from "@turf/turf";
import chalk from "chalk";
import _ from "lodash";
import { WriteStream } from "node:tty";

import { deepClean } from "../../deep-clean";
import { TrivialName } from "../../helpers-for-names";
import { normalizeSpacing } from "../../normalize-spacing";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
} from "../../output-layers";
import { getTerritoryExtent } from "../../territory";
import { readFetchedOsmFeatureCollection } from "./read-fetched-osm-feature-collection";
import { OsmFeature, OsmFeatureProperties } from "./types";

const buildWikidataUrl = (
  wikidataId: string | undefined,
): string | undefined => {
  if (!wikidataId) {
    return undefined;
  }

  return `http://www.wikidata.org/entity/${wikidataId}`;
};

// https://wiki.openstreetmap.org/wiki/RU:Key:architect
const extractArchitect = (
  building: OsmFeature,
): Pick<OutputLayerProperties, "architect"> | undefined => {
  const architect = normalizeSpacing(building.properties["architect"] ?? "");
  if (!architect) {
    return undefined;
  }

  return { architect };
};

// https://wiki.openstreetmap.org/wiki/RU:Key:building:architecture
// Note that ‘-’ is replaced with ‘_’ in some values for normalization
const styleByBuildingArchitectureTagValue: Record<string, string> = {
  /* eslint-disable @typescript-eslint/naming-convention -- keys are based on third-party data */
  art_deco: "ар-деко",
  art_nouveau: "модерн",
  baroque: "барокко",
  brutalist: "брутализм",
  constructivism: "конструктивизм",
  contemporary: "современная архитектура",
  cubism: "кубизм",
  eclectic: "эклектика",
  empire: "ампир",
  functionalism: "функционализм",
  gothic: "готика",
  historicism: "историзм",
  international_style: "интернациональный стиль",
  mannerism: "маньеризм",
  modern: "модернизм",
  neo_baroque: "необарокко",
  neo_byzantine: "неовизантийский",
  neo_gothic: "неоготика",
  neo_renaissance: "неоренессанс",
  neo_romanesque: "неороманский",
  neoclassicism: "классицизм",
  postmodern: "постмодернизм",
  pseudo_gothic: "русская псевдоготика",
  pseudo_russian: "псевдорусский стиль",
  renaissance: "ренессанс",
  rococo: "рококо",
  russian_gothic: "русская псевдоготика",
  stalinist_neoclassicism: "сталинский неоклассицизм",
  /* eslint-enable @typescript-eslint/naming-convention */
};

const extractStyle = (
  building: OsmFeature,
  output: WriteStream | undefined,
): Pick<OutputLayerProperties, "style"> | undefined => {
  const normalizedBuildingArchitectureTagValue =
    building.properties["building:architecture"]
      ?.trim()
      .toLowerCase()
      .replaceAll("-", "_") ?? "";

  if (!normalizedBuildingArchitectureTagValue) {
    return undefined;
  }

  const style =
    styleByBuildingArchitectureTagValue[normalizedBuildingArchitectureTagValue];

  if (!style) {
    output?.write(
      chalk.yellow(
        `Unable to normalize value of "building:architecture" tag for https://www.openstreetmap.org/${building.properties.id}. Please fix and re-download the data or report a bug.\n`,
      ),
    );

    return undefined;
  }

  return { style };
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
      photoAuthorUrl: /\.*.userapi.com$/.test(host) ? "ВК" : host,
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
    case "cowshed":
    case "fuel":
    case "garage":
    case "garages":
    case "gazebo":
    case "greenhouse":
    case "kiosk":
    case "roof":
    case "service":
    case "shed":
    case "stable":
    case "sty":
      return 1;

    default:
      return undefined;
  }
};

// https://wiki.openstreetmap.org/wiki/Key:start_date
const processStartDate = (startDate: string | undefined) => {
  const result = normalizeSpacing(startDate ?? "")
    .toLowerCase()
    .replace(/^before (\d{4})$/, "до $1")
    .replace(/^~(\d{4})$/, "около $1");

  if (!result) {
    return;
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
  cowshed: "коровник",
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
  shed: "хозяйственная постройка",
  sports_hall: "спортивный зал",
  stable: "конюшня",
  storage_tank: "резервуар",
  sty: "свинарник",
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
    if (!feature.properties["name"]) {
      return false;
    }
    const intersection = turf.intersect(
      expectedBoundaryOfAllCheckedFeatures,
      feature,
    );

    return intersection && turf.area(intersection);
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
        return () => filteredBoundaryFeatures[0]?.properties["name"];
      }
    }
  }

  const orderedBoundaryFeatures = _.orderBy(filteredBoundaryFeatures, [
    // We prioritize boundaries that have no admin level (e.g. place=town/village)
    // to get higher quality settlement names. Examples:
    // - https://www.openstreetmap.org/relation/2552696 (goes first, so will be used)
    // - https://www.openstreetmap.org/relation/1846781 (goes second, so won’t be used)
    (boundaryFeature) => boundaryFeature.properties["admin_level"] ?? "0",
    // Within each group, we start by trying the largest boundaries to improve performance
    (boundaryFeature) => -turf.area(boundaryFeature.geometry),
  ]);

  return (feature: turf.Feature) =>
    orderedBoundaryFeatures.find((boundaryFeature) =>
      booleanIntersects(boundaryFeature, feature),
    )?.properties["name"];
};

export const generateOsmOutputLayer: GenerateOutputLayer = async ({
  output,
}): Promise<OutputLayer> => {
  const territoryExtent = await getTerritoryExtent();

  const buildingCollection = await readFetchedOsmFeatureCollection("buildings");

  const regionBoundaryCollection = await readFetchedOsmFeatureCollection(
    "boundaries-for-regions",
  );

  const settlementBoundaryCollection = await readFetchedOsmFeatureCollection(
    "boundaries-for-settlements",
  );

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
      output?.write(
        chalk.yellow(
          `Unable to find region for https://www.openstreetmap.org/${building.properties.id}\n`,
        ),
      );

      return undefined;
    }

    const settlement =
      building.properties["addr:city"] ?? getSettlement(building);
    if (!settlement) {
      output?.write(
        chalk.yellow(
          `Unable to find settlement (city / town / village) for https://www.openstreetmap.org/${building.properties.id}\n`,
        ),
      );

      return undefined;
    }

    const streetOrPlace2 =
      building.properties["addr2:street"] ??
      building.properties["addr:street2"];
    const fullStreetOrPlace = streetOrPlace2
      ? `${streetOrPlace.split("/")[0]!} / ${streetOrPlace2}`
      : streetOrPlace;

    const houseNumber2 =
      building.properties["addr2:housenumber"] ??
      building.properties["addr:housenumber2"];
    const fullHouseNumber = houseNumber2
      ? `${houseNumber.split("/")[0]!}/${houseNumber2}`
      : houseNumber;

    return {
      address: [region, settlement, fullStreetOrPlace, fullHouseNumber].join(
        ", ",
      ),
    };
  };

  const outputFeatures: OutputLayer["features"] =
    buildingCollection.features.flatMap((building) => {
      const buildingTagValue = building.properties["abandoned"]
        ? "abandoned"
        : building.properties["building"];
      const buildingType =
        buildingTagValue && buildingTagValue !== "yes"
          ? buildingTagValue
          : undefined;

      const floorCountAboveGround =
        Number.parseInt(building.properties["building:levels"] ?? "") ||
        deriveFloorCountAboveGroundFromBuildingTag(
          building.properties["building"],
        ) ||
        undefined;
      const floorCountBelowGround =
        Number.parseInt(
          building.properties["building:levels:underground"] ?? "",
        ) || undefined;

      const url =
        building.properties["contact:website"] ??
        building.properties["website"];

      const wikidataUrl = buildWikidataUrl(building.properties["wikidata"]);
      const wikipediaUrl = buildWikipediaUrl(
        building.properties["wikipedia"] ?? building.properties["wikipedia:ru"],
      );

      const outputLayerProperties: OutputLayerProperties = deepClean({
        ...extractAddress(building),
        // TODO: Move more properties to ...extract*() patterns for better code readability and composability
        buildingType,
        completionTime: processStartDate(building.properties["start_date"]),
        floorCountAboveGround,
        floorCountBelowGround,
        id: building.properties.id,
        knownAt: buildingCollection.fetchedAt,
        name:
          building.properties["name"] ??
          generateTrivialNameFromOsmTags(building.properties),
        url,
        wikidataUrl,
        ...extractArchitect(building),
        ...extractPhoto(building),
        ...extractStyle(building, output),
        wikipediaUrl,
      });

      // Simplify geometry to avoid redundant nodes from building parts and entrances
      try {
        const geometry = turf.truncate(
          turf.simplify(building.geometry, { tolerance: 0.000_001 }),
          { precision: 6 },
        );

        return [turf.feature(geometry, outputLayerProperties)];
      } catch {
        output?.write(
          chalk.yellow(
            `Unable to simplify geometry for https://www.openstreetmap.org/${building.properties.id}. Building is skipped.\n`,
          ),
        );

        return [];
      }
    });

  return {
    type: "FeatureCollection",
    knownAt: buildingCollection.fetchedAt,
    layerRole: "base",
    features: outputFeatures,
  };
};
