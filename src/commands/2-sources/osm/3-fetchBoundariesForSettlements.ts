import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { createBboxFeature } from "../../../shared/helpersForGeometry";
import { getFetchedOsmBoundariesForSettlementsFilePath } from "../../../shared/sources/osm";
import { generateFetchOsmObjects } from "../../../shared/sources/osm/generateFetchOsmObjects";
import { getTerritoryExtent } from "../../../shared/territory";

export const fetchBoundaries = generateFetchOsmObjects({
  acceptedGeometryTypes: ["Polygon", "MultiPolygon"],

  filePath: getFetchedOsmBoundariesForSettlementsFilePath(),

  getExtent: async (extentVersion) => {
    const territoryExtent = await getTerritoryExtent();
    if (extentVersion === 0) {
      return territoryExtent;
    }
    const bufferInMeters = extentVersion * 100 * 1000;

    return createBboxFeature(territoryExtent, bufferInMeters);
  },

  needToTryAnotherExtentVersion: (geojsonData) => !geojsonData.features.length,

  selectors: [
    'way["place"~"^(city|town|village)$"]',
    'relation["place"~"^(city|town|village)$"]',
  ],

  title: "boundaries for settlements",
});

autoStartCommandIfNeeded(fetchBoundaries, __filename);
