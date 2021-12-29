import { generateGeographicContextExtent } from "../../../shared/geographicContext";
import { getFetchedOsmRoadsFilePath } from "../../../shared/sources/osm";
import { generateFetchOsmObjects } from "../../../shared/sources/osm/generateFetchOsmObjects";
import { getTerritoryExtent } from "../../../shared/territory";

const script = generateFetchOsmObjects({
  acceptedGeometryTypes: ["LineString", "Polygon"],
  filePath: getFetchedOsmRoadsFilePath(),
  getExtent: async () =>
    generateGeographicContextExtent(await getTerritoryExtent()),
  output: process.stdout,
  selectors: [
    'way["highway"~"motorway"]', // ~ helps include "×_link"
    'way["highway"~"trunk"]',
    'way["highway"~"primary"]',
    'way["highway"~"secondary"]',

    'way["highway"="living_street"]',
    'way["highway"="pedestrian"]',
    'way["highway"="residential"]',
    'way["highway"="tertiary"]',
    'way["highway"="unclassified"]',
  ],
  title: "roads",
});

await script();
