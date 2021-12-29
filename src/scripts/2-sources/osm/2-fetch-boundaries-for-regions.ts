import { createBboxFeature } from "../../../shared/helpersForGeometry";
import { getFetchedOsmBoundariesForRegionsFilePath } from "../../../shared/sources/osm";
import { generateFetchOsmObjects } from "../../../shared/sources/osm/generateFetchOsmObjects";
import { getTerritoryExtent } from "../../../shared/territory";

const script = generateFetchOsmObjects({
  acceptedGeometryTypes: ["Polygon", "MultiPolygon"],

  filePath: getFetchedOsmBoundariesForRegionsFilePath(),

  getExtent: async (extentVersion) => {
    const territoryExtent = await getTerritoryExtent();
    if (extentVersion === 0) {
      return territoryExtent;
    }
    const bufferInMeters = extentVersion * extentVersion * 100 * 1000;

    return createBboxFeature(territoryExtent, bufferInMeters);
  },

  needToTryAnotherExtentVersion: (geojsonData) => !geojsonData.features.length,

  output: process.stdout,

  selectors: [
    // https://wiki.openstreetmap.org/wiki/RU:Tag:boundary%3Dadministrative
    // ↳ Административные уровни (admin_level) в Российской Федерации
    'way["admin_level"="4"]',
    'relation["admin_level"="4"]',
  ],

  title: "boundaries for regions",
});

script();
