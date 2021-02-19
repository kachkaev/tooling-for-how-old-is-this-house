import * as turf from "@turf/turf";
import chalk from "chalk";

import {
  combineAddressParts,
  normalizeAddressPart,
  normalizeBuilding,
  normalizeStreet,
  splitAddress,
} from "../../addresses";
import { deepClean } from "../../deepClean";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
} from "../../output";
import { extractYearFromDates } from "../../output/parseYear";
import { generateMingkhHouseInfoCollection } from "./generateMingkhHouseInfoCollection";

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

export const generateMingkhOutputLayer: GenerateOutputLayer = async ({
  logger,
}) => {
  const houseInfoCollection = await generateMingkhHouseInfoCollection();

  const outputFeatures: OutputLayer["features"] = houseInfoCollection.features.map(
    (houseInfo) => {
      let normalizedAddress: string | undefined = undefined;
      try {
        normalizedAddress = houseInfo.properties.address
          ? normalizeMingkhAddress(houseInfo.properties.address)
          : undefined;
      } catch (e) {
        logger?.log(chalk.yellow(e.message ?? e));
      }

      const outputLayerProperties: OutputLayerProperties = {
        id: `${houseInfo.properties.id}`,
        completionDates: houseInfo.properties["start_date"],
        completionYear: extractYearFromDates(
          houseInfo.properties["start_date"],
        ),
        normalizedAddress,
        knownAt: houseInfo.properties.fetchedAt,
      };

      return turf.feature(houseInfo.geometry, deepClean(outputLayerProperties));
    },
  );

  return turf.featureCollection(outputFeatures);
};
