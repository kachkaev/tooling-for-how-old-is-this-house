import sortKeys from "sort-keys";

import { formatJson, serializeTime } from "./helpersForJson";

export const prependCommentWithTimeToHtml = (
  html: string,
  time?: string,
  label = "fetchedAt",
): string => {
  return `<!-- ${label}: ${serializeTime(time)} -->\n${html}`;
};

export const prependCommentWithJsonToHtml = (
  html: string,
  json: unknown,
): string => {
  const formattedJson = formatJson(sortKeys(json as JSON, { deep: true }));
  const indexOfNewline = formattedJson.indexOf("\n");
  const indexOfSecondNewline = formattedJson.indexOf("\n", indexOfNewline);
  if (indexOfSecondNewline === -1) {
    return `<!-- ${formattedJson.slice(
      0,
      Math.max(0, indexOfNewline),
    )} -->\n${html}`;
  }

  return `<!--\n${formattedJson}-->\n${html}`;
};

export const extractSerializedTimeFromPrependedHtmlComment = (
  html: string,
): string => {
  const rawFetchedAtMatch = html.match(/^<!-- \w+: (.*?) -->/);

  if (!rawFetchedAtMatch?.[1]) {
    throw new Error("Unable to find prepended serialized time in html");
  }

  return rawFetchedAtMatch[1];
};

export const extractJsonFromPrependedHtmlComment = <
  T = Record<string, unknown>,
>(
  html: string,
): T => {
  const match = html.match(/^<!--(.*?)-->/s);

  if (!match?.[1]) {
    throw new Error(`Unable to find prepended comment in html`);
  }

  try {
    const json = JSON.parse(match[1].trim()) as unknown;

    return json as T;
  } catch {
    throw new Error("Unable to parse prepended JSON in html");
  }
};
