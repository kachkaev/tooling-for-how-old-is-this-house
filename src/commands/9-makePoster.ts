import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";

import { makePageSnapshot } from "../shared/pageSnapshots";
import { getPosterConfig } from "../shared/territory";

export const makePoster: Command = async ({ logger }) => {
  const posterLayout = (await getPosterConfig()).layout;
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
