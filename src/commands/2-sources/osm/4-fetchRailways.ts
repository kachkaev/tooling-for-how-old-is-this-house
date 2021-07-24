import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateGeographicContextExtent } from "../../../shared/geographicContext";
import { getFetchedOsmRailwaysFilePath } from "../../../shared/sources/osm";
import { generateFetchOsmObjects } from "../../../shared/sources/osm/generateFetchOsmObjects";
import { getTerritoryExtent } from "../../../shared/territory";

export const fetchRoads = generateFetchOsmObjects({
  acceptedGeometryTypes: ["LineString"],
  filePath: getFetchedOsmRailwaysFilePath(),
  getExtent: async () =>
    generateGeographicContextExtent(await getTerritoryExtent()),
  selectors: [
    'way["railway"="rail"]',
    'relation["railway"="rail"]',
    'way["railway"="monorail"]',
    'relation["railway"="monorail"]',
    'way["railway"="narrow_gauge"]',
    'relation["railway"="narrow_gauge"]',
  ],
  title: "railways",
});

autoStartCommandIfNeeded(fetchRoads, __filename);
