import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { getFetchedOsmRailwaysFilePath } from "../../../shared/sources/osm";
import { generateFetchOsmObjects } from "../../../shared/sources/osm/generateFetchOsmObjects";

export const fetchRoads = generateFetchOsmObjects({
  acceptedGeometryTypes: ["LineString"],
  filePath: getFetchedOsmRailwaysFilePath(),
  selectors: [
    'way["railway"="rail"]',
    'relation["railway"="rail"]',
    'way["railway"="monorail"]',
    'relation["railway"="monorail"]',
    'way["railway"="narrow_gauge"]',
    'relation["railway"="narrow_gauge"]',
  ],
  territoryExtentBboxBufferInMeters: 5000,
  title: "railways",
});

autoStartCommandIfNeeded(fetchRoads, __filename);
