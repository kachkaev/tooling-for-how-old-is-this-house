import execa from "execa";

import { getMixedPropertyVariantsFilePath } from "../shared/mixing";
import { getOsmDirPath } from "../shared/sources/osm";
import { getTerritoryExtentFilePath } from "../shared/territory";

const script = async () => {
  await execa(
    "next-remote-watch",
    [
      // Justified by src/pages/poster.tsx
      getOsmDirPath(),
      getMixedPropertyVariantsFilePath(),
      getTerritoryExtentFilePath(),
    ],
    {
      stdio: "inherit",
    },
  );
};

script();