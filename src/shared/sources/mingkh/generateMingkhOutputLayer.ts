import * as turf from "@turf/turf";

import { normalizeAddress } from "../../addresses";
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
  addressNormalizationConfig,
}) => {
  const houseInfoCollection = await generateMingkhHouseInfoCollection();

  const outputFeatures: OutputLayer["features"] = houseInfoCollection.features.map(
    (houseInfo) => {
      const outputLayerProperties: OutputLayerProperties = {
        id: `${houseInfo.properties.id}`,
        completionDates: stringifyCompletionYear(houseInfo.properties.year),
        completionYear: houseInfo.properties.year,
        normalizedAddress: normalizeAddress(
          houseInfo.properties.address,
          addressNormalizationConfig,
        ),
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
