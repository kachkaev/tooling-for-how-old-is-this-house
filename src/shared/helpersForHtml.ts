import { serializeTime } from "./helpersForJson";

export const prependCommentWithTimeToHtml = (
  html: string,
  time?: string,
  label = "fetchedAt",
) => {
  return `<!-- ${label}: ${serializeTime(time)} -->\n${html}`;
};

export const extractSerializedTimeFromPrependedHtmlComment = (
  html: string,
): string => {
  const rawFetchedAtMatch = html.match(/^<!-- \w+: (.*) -->/);

  if (!rawFetchedAtMatch?.[1]) {
    throw new Error("Unable to find prepended serialized time in html");
  }

  return rawFetchedAtMatch?.[1];
};
