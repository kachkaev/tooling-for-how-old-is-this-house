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
  target: "draft" | "preprint";
  layout: {
    widthInMillimeters: number;
    heightInMillimeters: number;
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
}

const defaultColorByCompletionYear = {
  0: "hsl(105,100%, 12%)",
  1700: "hsl(105, 99%, 15%)",
  1800: "hsl( 95, 73%, 21%)",
  1850: "hsl( 85, 61%, 27%)",
  1900: "hsl( 75, 60%, 32%)",
  1920: "hsl(  4, 60%, 65%)",
  1930: "hsl(  8, 70%, 73%)",
  1940: "hsl( 12, 80%, 81%)",
  1950: "hsl(327, 24%, 87%)",
  1960: "hsl(250, 40%, 81%)",
  1970: "hsl(240, 45%, 73%)",
  1980: "hsl(230, 50%, 65%)",
  1990: "hsl(209, 65%, 49%)",
  2000: "hsl(210, 70%, 42%)",
  2010: "hsl(211, 80%, 34%)",
  2020: "hsl(212, 90%, 28%)",
};

const defaultPosterConfig: PosterConfig = {
  layout: {
    // https://www.ikea.com/ru/ru/cat/knoppeng-seriya-30631/
    // 610x910, 500×700, 400×500, 300×400, 210×300
    widthInMillimeters: 700,
    heightInMillimeters: 500,
  },
  map: {
    zoomInMillimetersPerKilometer: 30,
    offsetXInMillimeters: 0,
    offsetYInMillimeters: 0,
    centerLonLat: [0, 0],
    territoryExtentOutline: false,
  },
  target: "draft",

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

export const extractPrinterBleedInMillimeters = (
  posterConfig: PosterConfig,
): number => {
  return posterConfig.target === "preprint" ? 5 : 0;
};
