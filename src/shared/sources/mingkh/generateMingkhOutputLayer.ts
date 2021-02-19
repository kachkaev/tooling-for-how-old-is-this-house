import * as turf from "@turf/turf";

import {
  combineAddressParts,
  normalizeAddressPart,
  normalizeBuilding,
  normalizeStreet,
  splitAddress,
} from "../../addresses";
import { GenerateOutputLayer, OutputLayer } from "../../output";

export const notFilledIn = ["Не заполнено", "Нет данных"];

// ул. Попова, д. 2, Пенза, Пензенская область
// ул. Механизаторов, д. 13, к. 0, стр. 0, лит. 0, Засечное, Пензенская область
export const normalizeMingkhAddress = (address: string): string => {
  const addressParts = splitAddress(address);
  if (addressParts.length < 4 || addressParts.length > 7) {
    throw new Error(`Too many or too few address parts in "${address}"`);
  }
  const street = normalizeStreet(addressParts[0]!);
  const region = addressParts[addressParts.length - 1]!;
  const city = addressParts[addressParts.length - 2]!;
  const building = normalizeBuilding(
    addressParts[1]!,
    ...addressParts.slice(2, addressParts.length - 2),
  );

  return combineAddressParts(
    [region, city, street, building].map(normalizeAddressPart),
  );
};

export const generateMingkhOutputLayer: GenerateOutputLayer = async () =>
  // {
  // logger,
  // },
  {
    // const buildingCollection = (await fs.readJson(
    //   getFetchedOsmBuildingsFilePath(),
    // )) as OsmFeatureCollection;

    // const boundaryCollection = (await fs.readJson(
    //   getFetchedOsmBoundariesFilePath(),
    // )) as OsmFeatureCollection;

    // const getFederalSubjectName = generateGetIntersectedBoundaryName({
    //   boundaryFeatures: boundaryCollection.features,
    //   boundaryFeatureFilter: (feature) =>
    //     feature.properties?.["admin_level"] === "4",
    //   expectedBoundaryOfAllCheckedFeatures: regionExtent,
    // });

    // const getPlaceName = generateGetIntersectedBoundaryName({
    //   boundaryFeatures: boundaryCollection.features,
    //   boundaryFeatureFilter: (feature) => feature.properties?.["place"],
    //   expectedBoundaryOfAllCheckedFeatures: regionExtent,
    // });

    // const generateNormalizedAddress = (
    //   building: OsmFeature,
    // ): string | undefined => {
    //   const streetName = building.properties["addr:street"];
    //   const houseNumber = building.properties["addr:housenumber"];
    //   if (!streetName || !houseNumber) {
    //     return undefined;
    //   }
    //   const federalSubjectName = getFederalSubjectName(building);
    //   if (!federalSubjectName) {
    //     logger?.log(
    //       chalk.yellow(
    //         `Unable to find federal subject for ${building.properties.id}`,
    //       ),
    //     );

    //     return undefined;
    //   }
    //   const placeName = getPlaceName(building);
    //   if (!placeName) {
    //     logger?.log(
    //       chalk.yellow(
    //         `Unable to find place (city / town / village) for ${building.properties.id}`,
    //       ),
    //     );

    //     return undefined;
    //   }

    //   return combineAddressParts([
    //     normalizeAddressPart(federalSubjectName),
    //     normalizeAddressPart(placeName),
    //     normalizeStreet(streetName),
    //     normalizeBuilding(houseNumber),
    //   ]);
    // };

    const outputFeatures: OutputLayer["features"] = [];
    // const outputFeatures: OutputLayer["features"] = buildingCollection.features.map(
    //   (building) => {
    //     const outputLayerProperties: OutputLayerProperties = {
    //       id: building.properties.id,
    //       completionDates: building.properties["start_date"],
    //       completionYear: extractYearFromDates(building.properties["start_date"]),
    //       normalizedAddress: generateNormalizedAddress(building),
    //       knownAt: buildingCollection.properties.fetchedAt,
    //     };

    //     return turf.feature(building.geometry, deepClean(outputLayerProperties));
    //   },
    // );
    // // logger?.log({ buildingCollection, getFederalSubjectName, getPlaceName });

    return turf.featureCollection(outputFeatures);
  };
