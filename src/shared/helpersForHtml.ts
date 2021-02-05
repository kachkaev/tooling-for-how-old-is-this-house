import { getSerialisedNow } from "./helpersForJson";

export const getSerialisedNowForHtml = () =>
  `<!-- fetchedAt: ${getSerialisedNow()} -->\n`;
