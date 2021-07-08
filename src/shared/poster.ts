import * as turf from "@turf/turf";
import _ from "lodash";

import { TerritoryConfig, TerritoryExtent } from "./territory";

export interface PosterConfig {
  layout: {
    widthInMillimeters: number;
    heightInMillimeters: number;
    printerBleedInMillimeters: number;
    printerCropMarks: boolean;
  };
  map: {
    buildingSampleSize?: number;
    centerLonLat: turf.Position;
    territoryExtentOutline: boolean;
  };
}

const defaultPosterConfig: PosterConfig = {
  layout: {
    widthInMillimeters: 700,
    heightInMillimeters: 500,
    printerBleedInMillimeters: 0,
    printerCropMarks: false,
  },
  map: {
    territoryExtentOutline: false,
    centerLonLat: [0, 0],
  },
};

export const extractPosterConfig = (
  territoryConfig: TerritoryConfig,
  territoryExtent: TerritoryExtent,
): PosterConfig => {
  const rawPosterConfig = territoryConfig.poster;

  // TODO: Handle edge cases

  const result = _.defaultsDeep(
    {},
    rawPosterConfig,
    defaultPosterConfig,
  ) as PosterConfig;

  if (!result.map.centerLonLat[0] || !result.map.centerLonLat[1]) {
    result.map.centerLonLat = turf.centerOfMass(
      territoryExtent,
    ).geometry.coordinates;
  }

  return result;
};
