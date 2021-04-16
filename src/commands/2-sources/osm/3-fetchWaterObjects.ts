import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { getFetchedOsmWaterObjectsFilePath } from "../../../shared/sources/osm";
import { generateFetchOsmObjects } from "../../../shared/sources/osm/generateFetchOsmObjects";

export const fetchWaterObjects = generateFetchOsmObjects({
  acceptedGeometryTypes: [
    "LineString",
    "MultiLineString",
    "Polygon",
    "MultiPolygon",
  ],
  filePath: getFetchedOsmWaterObjectsFilePath(),
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
  territoryExtentBboxBufferInMeters: 5000,
  title: "water objects",
});

autoStartCommandIfNeeded(fetchWaterObjects, __filename);
