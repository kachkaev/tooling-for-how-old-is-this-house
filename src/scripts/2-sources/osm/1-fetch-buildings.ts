import { getFetchedOsmBuildingsFilePath } from "../../../shared/sources/osm";
import { generateFetchOsmObjects } from "../../../shared/sources/osm/generateFetchOsmObjects";

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

script();
