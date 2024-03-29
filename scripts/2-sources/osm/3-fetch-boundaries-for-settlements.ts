import { createBboxFeature } from "../../../shared/helpers-for-geometry";
import { getFetchedOsmBoundariesForSettlementsFilePath } from "../../../shared/source-osm";
import { generateFetchOsmObjects } from "../../../shared/source-osm/generate-fetch-osm-objects";
import { getTerritoryExtent } from "../../../shared/territory";

const script = generateFetchOsmObjects({
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

  needToTryAnotherExtentVersion: (geojsonData) =>
    geojsonData.features.length === 0,

  output: process.stdout,

  selectors: [
    'way["place"~"^(city|town|village)$"]',
    'relation["place"~"^(city|town|village)$"]',
    // https://wiki.openstreetmap.org/wiki/RU:Tag:boundary%3Dadministrative
    'way["admin_level"~"^(6|8)$"]',
    'relation["admin_level"~"^(6|8)$"]',
  ],

  title: "boundaries for settlements",
});

await script();
