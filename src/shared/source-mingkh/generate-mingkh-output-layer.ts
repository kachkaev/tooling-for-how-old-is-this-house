import * as turf from "@turf/turf";

import { deepClean } from "../deep-clean";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
} from "../stage-output-layers";
import { generateMingkhHouseInfoCollection } from "./generate-mingkh-house-info-collection";

export const notFilledIn = ["Не заполнено", "Нет данных"];

export const generateMingkhOutputLayer: GenerateOutputLayer = async ({
  output,
}) => {
  const houseInfoCollection = await generateMingkhHouseInfoCollection({
    output,
  });

  const outputFeatures: OutputLayer["features"] =
    houseInfoCollection.features.map((houseInfo) => {
      const outputLayerProperties: OutputLayerProperties = deepClean({
        id: `${houseInfo.properties.id}`,

        address: houseInfo.properties.address,
        completionTime: houseInfo.properties.year
          ? `${houseInfo.properties.year}`
          : undefined,
        floorCountAboveGround: houseInfo.properties.numberOfFloors,
        knownAt: houseInfo.properties.fetchedAt,
      });

      return turf.feature(houseInfo.geometry, outputLayerProperties);
    });

  return {
    type: "FeatureCollection",
    layerRole: "patch",
    features: outputFeatures,
  };
};
