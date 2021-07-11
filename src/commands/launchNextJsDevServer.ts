import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import execa from "execa";

import { getMixedPropertyVariantsFilePath } from "../shared/outputMixing";
import { getOsmDirPath } from "../shared/sources/osm";
import { getTerritoryExtentFilePath } from "../shared/territory";

export const launchNextJsDevServer: Command = async () => {
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

autoStartCommandIfNeeded(launchNextJsDevServer, __filename);
