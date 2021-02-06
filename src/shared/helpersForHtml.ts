import { getSerialisedNow } from "./helpersForJson";

export const getSerialisedNowForHtml = () =>
  `<!-- fetchedAt: ${getSerialisedNow()} -->\n`;

export const extractFetchedAt = (html: string): string => {
  const rawFetchedAtMatch = html.match(/^<!-- fetchedAt: (.*) -->/);

  if (!rawFetchedAtMatch?.[1]) {
    throw new Error("Unable to find fetchedAt in html");
  }

  return rawFetchedAtMatch?.[1];
};
