import * as turf from "@turf/turf";

import { stringifyCompletionYear } from "../../completionDates";
import { deepClean } from "../../deepClean";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
} from "../../output";
import { generateMingkhHouseInfoCollection } from "./generateMingkhHouseInfoCollection";

export const notFilledIn = ["Не заполнено", "Нет данных"];

export const generateMingkhOutputLayer: GenerateOutputLayer = async ({
  logger,
}) => {
  const houseInfoCollection = await generateMingkhHouseInfoCollection({
    logger,
  });

  const outputFeatures: OutputLayer["features"] = houseInfoCollection.features.map(
    (houseInfo) => {
      const outputLayerProperties: OutputLayerProperties = {
        id: `${houseInfo.properties.id}`,
        completionDates: stringifyCompletionYear(houseInfo.properties.year),
        address: houseInfo.properties.address,
        knownAt: houseInfo.properties.fetchedAt,
      };

      return turf.feature(houseInfo.geometry, deepClean(outputLayerProperties));
    },
  );

  return {
    type: "FeatureCollection",
    layerRole: "patch",
    features: outputFeatures,
  };
};
