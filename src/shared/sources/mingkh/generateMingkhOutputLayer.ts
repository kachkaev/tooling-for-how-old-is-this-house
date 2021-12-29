import * as turf from "@turf/turf";

import { deepClean } from "../../deepClean";
import {
  GenerateOutputLayer,
  OutputLayer,
  OutputLayerProperties,
} from "../../outputLayers";
import { generateMingkhHouseInfoCollection } from "./generateMingkhHouseInfoCollection";

export const notFilledIn = ["Не заполнено", "Нет данных"];

export const generateMingkhOutputLayer: GenerateOutputLayer = async ({
  output,
}) => {
  const houseInfoCollection = await generateMingkhHouseInfoCollection({
    output,
  });

  const outputFeatures: OutputLayer["features"] =
    houseInfoCollection.features.map((houseInfo) => {
      const outputLayerProperties: OutputLayerProperties = {
        id: `${houseInfo.properties.id}`,

        address: houseInfo.properties.address,
        completionTime: houseInfo.properties.year
          ? `${houseInfo.properties.year}`
          : undefined,
        floorCountAboveGround: houseInfo.properties.numberOfFloors,
        knownAt: houseInfo.properties.fetchedAt,
      };

      return turf.feature(
        houseInfo.geometry ?? null,
        deepClean(outputLayerProperties),
      );
    });

  return {
    type: "FeatureCollection",
    layerRole: "patch",
    features: outputFeatures,
  };
};
