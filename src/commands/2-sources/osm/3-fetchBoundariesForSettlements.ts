import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { createBboxFeature } from "../../../shared/helpersForGeometry";
import { getFetchedOsmBoundariesForSettlementsFilePath } from "../../../shared/sources/osm";
import { generateFetchOsmObjects } from "../../../shared/sources/osm/generateFetchOsmObjects";
import { getTerritoryExtent } from "../../../shared/territory";

const command = generateFetchOsmObjects({
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
    // https://wiki.openstreetmap.org/wiki/RU:Tag:boundary%3Dadministrative
    'way["admin_level"~"^(6|8)$"]',
    'relation["admin_level"~"^(6|8)$"]',
  ],

  title: "boundaries for settlements",
});

autoStartCommandIfNeeded(command, __filename);

export default command;
