import * as turf from "@turf/turf";
import _ from "lodash";

import { TerritoryConfig, TerritoryExtent } from "./territory";

// https://stackoverflow.com/a/50770949/1818285
const nilMerge = <T>(a: T, b: T): T => (_.isNil(a) ? b : a);
const nilMergeDeep = <T>(a: T, b: T): T =>
  _.isObject(a) && !_.isArray(a)
    ? _.mergeWith({}, a, b, nilMergeDeep)
    : nilMerge(a, b);

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
    abnormalYearBuildingCountCap: number;
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

// https://observablehq.com/@d3/color-schemes - inspired by continuous spectral
const defaultColorByCompletionYear = {
  0: "#9e0142",
  1850: "#b51b47",
  1900: "#D7444A",
  1920: "#f46d43",
  1940: "#fa9c5a",
  1950: "#fed382",
  1960: "#f7faaf",
  1970: "#a8dca2",
  1980: "#66c2a5",
  1990: "#4CA5B1",
  2000: "#4289b5",
  2010: "#4c68ad",
  2020: "#5e4fa2",
};

const defaultPosterConfig: PosterConfig = {
  layout: {
    // https://www.ikea.com/ru/ru/cat/knoppeng-seriya-30631/
    // 610x910, 500×700, 400×500, 300×400, 210×300
    widthInMillimeters: 700,
    heightInMillimeters: 500,
    printerBleedInMillimeters: 0,
    printerCropMarks: false,
  },
  map: {
    zoomInMillimetersPerKilometer: 30,
    offsetXInMillimeters: 0,
    offsetYInMillimeters: 0,
    centerLonLat: [0, 0],
    territoryExtentOutline: false,
  },
  timeline: {
    abnormalYears: [],
    abnormalYearBuildingCountCap: 200,
    marginLeftInMillimeters: 25,
    marginRightInMillimeters: 25,
    marginBottomInMillimeters: 35,

    minYear: 1795,
    minYearLabelOffsetXInMillimeters: -0.5,
    minYearLabel: "···",
    maxYear: 2021,
  },
  colorByCompletionYear: {},
  colorForUnknownCompletionYear: "#3d424a",
};

export const extractPosterConfig = (
  territoryConfig: TerritoryConfig,
  territoryExtent: TerritoryExtent,
): PosterConfig => {
  const rawPosterConfig = territoryConfig.poster;

  // TODO: Handle edge cases

  const result = _.mergeWith(
    {},
    rawPosterConfig,
    defaultPosterConfig,
    nilMergeDeep,
  ) as PosterConfig;

  if (!Object.keys(result.colorByCompletionYear).length) {
    result.colorByCompletionYear = defaultColorByCompletionYear;
  }

  if (!result.map.centerLonLat[0] || !result.map.centerLonLat[1]) {
    result.map.centerLonLat = turf.centroid(
      turf.bboxPolygon(turf.bbox(territoryExtent)),
    ).geometry.coordinates as [number, number];
  }

  return result;
};

export interface LegendEntry {
  completionYear: number;
  color: string;
}

export const extractLegendEntries = (
  posterConfig: PosterConfig,
): LegendEntry[] => {
  return Object.entries(posterConfig.colorByCompletionYear).map(
    ([rawCompletionYear, color]) => ({
      completionYear: parseInt(rawCompletionYear),
      color,
    }),
  );
};
