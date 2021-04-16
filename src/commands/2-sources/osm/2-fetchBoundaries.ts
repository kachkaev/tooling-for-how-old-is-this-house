import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { getFetchedOsmBoundariesFilePath } from "../../../shared/sources/osm";
import { generateFetchOsmObjects } from "../../../shared/sources/osm/generateFetchOsmObjects";

export const fetchBoundaries = generateFetchOsmObjects({
  acceptedGeometryTypes: ["Polygon", "MultiPolygon"],
  filePath: getFetchedOsmBoundariesFilePath(),
  selectors: [
    'way["admin_level"="4"]',
    'relation["admin_level"="4"]',
    'way["place"~"^(city|town|village)$"]',
    'relation["place"~"^(city|town|village)$"]',
  ],
  title: "boundaries",
});

autoStartCommandIfNeeded(fetchBoundaries, __filename);
