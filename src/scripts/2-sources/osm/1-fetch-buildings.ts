import { getFetchedOsmBuildingsFilePath } from "../../../shared/sources/osm";
import { generateFetchOsmObjects } from "../../../shared/sources/osm/generate-fetch-osm-objects";

const script = generateFetchOsmObjects({
  acceptedGeometryTypes: ["Polygon", "MultiPolygon"],
  filePath: getFetchedOsmBuildingsFilePath(),
  output: process.stdout,
  selectors: [
    'way["building"]',
    'relation["building"]', //
  ],
  title: "buildings",
});

await script();
