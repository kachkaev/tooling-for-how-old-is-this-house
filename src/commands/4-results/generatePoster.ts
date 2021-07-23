import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";

import { makePageSnapshot } from "../../shared/pageSnapshots";
import { extractPosterConfig } from "../../shared/poster";
import { ensureTerritoryGitignoreContainsResults } from "../../shared/results";
import { getTerritoryConfig, getTerritoryExtent } from "../../shared/territory";

export const generatePoster: Command = async ({ logger }) => {
  const posterLayout = extractPosterConfig(
    await getTerritoryConfig(),
    await getTerritoryExtent(),
  ).layout;

  // TODO: link to environment variables
  const formats = ["pdf"];

  await ensureTerritoryGitignoreContainsResults();

  await makePageSnapshot({
    pagePath: "poster",
    logger,
    imageScaleFactor: 3,
    imageExtension: formats.includes("jpg") ? "jpg" : undefined,
    pdfSizeInMillimeters: formats.includes("pdf")
      ? [
          posterLayout.widthInMillimeters +
            posterLayout.printerBleedInMillimeters * 2,
          posterLayout.heightInMillimeters +
            posterLayout.printerBleedInMillimeters * 2,
        ]
      : undefined,
  });
};

autoStartCommandIfNeeded(generatePoster, __filename);
