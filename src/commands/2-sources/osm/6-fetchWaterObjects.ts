import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { createBboxFeature } from "../../../shared/helpersForGeometry";
import { getFetchedOsmWaterObjectsFilePath } from "../../../shared/sources/osm";
import { generateFetchOsmObjects } from "../../../shared/sources/osm/generateFetchOsmObjects";
import { getTerritoryExtent } from "../../../shared/territory";

export const fetchWaterObjects = generateFetchOsmObjects({
  acceptedGeometryTypes: [
    "LineString",
    "MultiLineString",
    "Polygon",
    "MultiPolygon",
  ],
  filePath: getFetchedOsmWaterObjectsFilePath(),
  getExtent: async () => createBboxFeature(await getTerritoryExtent(), 5000),
  selectors: [
    'way["waterway"]',
    'relation["waterway"]',

    'way["natural"="water"]',
    'relation["natural"="water"]',

    'way["landuse"="reservoir"]',
    'relation["landuse"="reservoir"]',

    'way["natural"="wetland"]',
    'relation["natural"="wetland"]',
  ],
  title: "water objects",
});

autoStartCommandIfNeeded(fetchWaterObjects, __filename);
