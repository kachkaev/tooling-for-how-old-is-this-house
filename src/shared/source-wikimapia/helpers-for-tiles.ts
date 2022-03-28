import { WikimapiaTileData } from "./types";

/*
 * Is has been empirically established that the zoom level affects the sizes of objects
 * that are being returned. The lower the zoom, the larger the returned objects.
 * Zoom level 16 is enough to fetch objects with area of even 1–3 m², which includes even
 * small statues and water pumps. If data fetching is done significantly far from 50° north,
 * this level may need to be reconsidered.
 *
 * Recommended tile edge length is approximately 300-500 meters.
 */
export const getRecommendedWikimapiaTileZoom = (): number => {
  // TODO: getTerritoryExtent, map lat to zoom level, return Promise<number>

  return 16;
};

export const generateWikimapiaTileComment = (
  tileDataFilePath: string,
  tileData: WikimapiaTileData,
): string => {
  const numberOfFeatures = tileData.response.length;
  const numberOfFeaturesAsString = `${numberOfFeatures}`;

  return `${tileDataFilePath} ${numberOfFeaturesAsString.padStart(3)}`;
};
