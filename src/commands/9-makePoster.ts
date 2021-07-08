import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";

import { makePageSnapshot } from "../shared/pageSnapshots";
import { extractPosterConfig } from "../shared/poster";
import { getTerritoryConfig, getTerritoryExtent } from "../shared/territory";

export const makePoster: Command = async ({ logger }) => {
  const posterLayout = extractPosterConfig(
    await getTerritoryConfig(),
    await getTerritoryExtent(),
  ).layout;
  await makePageSnapshot({
    pagePath: "poster",
    logger,
    imageScaleFactor: 3,
    imageExtension: "jpg",
    pdfSizeInMillimeters: [
      posterLayout.widthInMillimeters +
        posterLayout.printerBleedInMillimeters * 2,
      posterLayout.heightInMillimeters +
        posterLayout.printerBleedInMillimeters * 2,
    ],
  });
};

autoStartCommandIfNeeded(makePoster, __filename);
