import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { generateGeographicContextExtent } from "../../../shared/geographicContext";
import { getFetchedOsmRoadsFilePath } from "../../../shared/sources/osm";
import { generateFetchOsmObjects } from "../../../shared/sources/osm/generateFetchOsmObjects";
import { getTerritoryExtent } from "../../../shared/territory";

export const fetchRoads = generateFetchOsmObjects({
  acceptedGeometryTypes: ["LineString"],
  filePath: getFetchedOsmRoadsFilePath(),
  getExtent: async () =>
    generateGeographicContextExtent(await getTerritoryExtent()),
  selectors: [
    'way["highway"~"trunk"]', // ~ helps include "×_link"
    'way["highway"~"primary"]',
    'way["highway"~"secondary"]',
    'way["highway"~"tertiary"]',
  ],
  title: "roads",
});

autoStartCommandIfNeeded(fetchRoads, __filename);
