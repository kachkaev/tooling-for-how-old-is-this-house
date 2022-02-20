import { execa } from "execa";

import { getOsmDirPath } from "../shared/source-osm";
import { getMixedPropertyVariantsFilePath } from "../shared/stage-mixing";
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

await script();
