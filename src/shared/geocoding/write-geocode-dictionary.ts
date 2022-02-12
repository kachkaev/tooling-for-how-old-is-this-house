import _ from "lodash";
import sortKeys from "sort-keys";

import { writeFormattedJson } from "../helpers-for-json";
import { GeocodeDictionary } from "./types";

export const writeGeocodeDictionary = async (
  dictionaryFilePath: string,
  dictionary: GeocodeDictionary,
): Promise<void> => {
  const entries = Object.entries(dictionary).map(
    ([address, addressRecord]) => [address, sortKeys(addressRecord)] as const,
  );

  const sortedEntries = _.orderBy(entries, ([address]) =>
    address
      .split(" ")
      .map((word) => {
        const numericStart = word.match(/^\d+/)?.[0];
        if (!numericStart) {
          return word;
        }

        return `${numericStart.padStart(4, "0")}${word.slice(
          numericStart.length,
        )}`;
      })
      .join(" "),
  );

  await writeFormattedJson(
    dictionaryFilePath,
    Object.fromEntries(sortedEntries),
  );
};
