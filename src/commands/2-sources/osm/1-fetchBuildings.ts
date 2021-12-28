import { autoStartCommandIfNeeded } from "@kachkaev/commands";

import { getFetchedOsmBuildingsFilePath } from "../../../shared/sources/osm";
import { generateFetchOsmObjects } from "../../../shared/sources/osm/generateFetchOsmObjects";

const command = generateFetchOsmObjects({
  acceptedGeometryTypes: ["Polygon", "MultiPolygon"],
  filePath: getFetchedOsmBuildingsFilePath(),
  selectors: [
    'way["building"]',
    'relation["building"]', //
  ],
  title: "buildings",
});

autoStartCommandIfNeeded(command, __filename);

export default command;
