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
    centerLonLat: [number, number];
    territoryExtentOutline: boolean;
    zoomInMillimetersPerKilometer: number;
    offsetXInMillimeters: number;
    offsetYInMillimeters: number;
  };
  timeline: {
    abnormalYears: number[];
    marginLeftInMillimeters: number;
    marginRightInMillimeters: number;
    marginBottomInMillimeters: number;

    minYear: number;
    minYearLabelOffsetXInMillimeters: number;
    minYearLabel?: string;

    maxYear: number;
  };
  colorByCompletionYear: Record<string, string>;
  colorForUnknownCompletionYear: string;
}

const defaultColorByCompletionYear = {
  0: "rgb(158, 1, 66)",
  1900: "rgb(205, 54, 75)",
  1920: "rgb(236, 101, 73)",
  1940: "rgb(250, 154, 89)",
  1950: "rgb(254, 203, 123)",
  1960: "rgb(253, 243, 170)",
  1970: "rgb(210, 237, 158)",
  1980: "rgb(145, 210, 164)",
  1990: "rgb(89, 176, 173)",
  2000: "rgb(66, 136, 181)",
  2010: "rgb(79, 100, 172)",
  // 2020: "rgb(94, 79, 162)"",
};

const defaultPosterConfig: PosterConfig = {
  layout: {
    widthInMillimeters: 700,
    heightInMillimeters: 500,
    printerBleedInMillimeters: 0,
    printerCropMarks: false,
  },
  map: {
    territoryExtentOutline: false,
    zoomInMillimetersPerKilometer: 100,
    offsetXInMillimeters: 0,
    offsetYInMillimeters: 0,
    centerLonLat: [0, 0],
  },
  timeline: {
    abnormalYears: [1900, 1910, 1917],
    marginLeftInMillimeters: 15,
    marginRightInMillimeters: 15,
    marginBottomInMillimeters: 35,

    minYear: 1795,
    minYearLabelOffsetXInMillimeters: -0.5,
    minYearLabel: "···",
    maxYear: 2020,
  },
  colorByCompletionYear: {},
  colorForUnknownCompletionYear: "#3E444b",
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

  if (!Object.keys(result.colorByCompletionYear).length) {
    result.colorByCompletionYear = defaultColorByCompletionYear;
  }

  if (!result.map.centerLonLat[0] || !result.map.centerLonLat[1]) {
    result.map.centerLonLat = turf.centerOfMass(territoryExtent).geometry
      .coordinates as [number, number];
  }

  return result;
};
