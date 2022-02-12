import { generateGeographicContextExtent } from "../../../shared/geographic-context";
import { getFetchedOsmRailwaysFilePath } from "../../../shared/sources/osm";
import { generateFetchOsmObjects } from "../../../shared/sources/osm/generate-fetch-osm-objects";
import { getTerritoryExtent } from "../../../shared/territory";

const script = generateFetchOsmObjects({
  acceptedGeometryTypes: ["LineString"],
  filePath: getFetchedOsmRailwaysFilePath(),
  getExtent: async () =>
    generateGeographicContextExtent(await getTerritoryExtent()),
  output: process.stdout,
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

await script();
