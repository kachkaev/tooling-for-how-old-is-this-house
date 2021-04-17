import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";

import { makeImage } from "../shared/images";

export const makePoster: Command = async ({ logger }) => {
  await makeImage({ pagePath: "poster", logger, deviceScaleFactor: 3 });
};

autoStartCommandIfNeeded(makePoster, __filename);
