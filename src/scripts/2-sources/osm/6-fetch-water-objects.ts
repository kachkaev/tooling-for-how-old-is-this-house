import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateGeographicContextExtent } from "../../../shared/geographicContext";
import { getFetchedOsmWaterObjectsFilePath } from "../../../shared/sources/osm";
import { generateFetchOsmObjects } from "../../../shared/sources/osm/generateFetchOsmObjects";
import { getTerritoryExtent } from "../../../shared/territory";

const command = generateFetchOsmObjects({
  acceptedGeometryTypes: [
    "LineString",
    "MultiLineString",
    "Polygon",
    "MultiPolygon",
  ],
  filePath: getFetchedOsmWaterObjectsFilePath(),
  getExtent: async () =>
    generateGeographicContextExtent(await getTerritoryExtent()),
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

autoStartCommandIfNeeded(command, __filename);

export default command;
