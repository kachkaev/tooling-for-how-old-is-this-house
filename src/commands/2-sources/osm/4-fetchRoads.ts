import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { getFetchedOsmRoadsFilePath } from "../../../shared/sources/osm";
import { generateFetchOsmObjects } from "../../../shared/sources/osm/generateFetchOsmObjects";

export const fetchRoads = generateFetchOsmObjects({
  acceptedGeometryTypes: ["LineString"],
  filePath: getFetchedOsmRoadsFilePath(),
  selectors: [
    'way["highway"~"trunk"]', // ~ helps include "×_link"
    'way["highway"~"primary"]',
    'way["highway"~"secondary"]',
  ],
  territoryExtentBboxBufferInMeters: 5000,
  title: "roads",
});

autoStartCommandIfNeeded(fetchRoads, __filename);
