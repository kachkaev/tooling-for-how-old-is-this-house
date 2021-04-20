import path from "path";

import { splitAddress } from "../addresses";
import { buildCleanedAddressAst } from "../addressessViaAst";
import { getTerritoryDirPath } from "../territory";

export const getGeocodeDictionariesDirPath = () => {
  return path.resolve(getTerritoryDirPath(), "geocoding");
};

export const getGeocodeDictionaryFileName = () => "dictionary.json";

export const getDictionaryFilePath = (sliceId: string) => {
  return path.resolve(
    getGeocodeDictionariesDirPath(),
    sliceId,
    getGeocodeDictionaryFileName(),
  );
};

/**
 *
 * for cleaned address (CAPS):
 *   first letters of words that are not designations
 *   e.g. "село проверочное 1234, улица тестовая" → "-/п-т"
 *
 * for standardised address (lower case):
 *   federal subject, settlement, street
 *
 * TODO: support villages
 *   federal subject, +district?, settlement, street
 */
export const deriveNormalizedAddressSliceId = (
  normalizedAddress: string,
): string => {
  const cleanedAddressAst = buildCleanedAddressAst(normalizedAddress);
  try {
    if (normalizedAddress.toLowerCase() === normalizedAddress) {
      return splitAddress(normalizedAddress)
        .slice(0, 3)
        .map((slice) => slice.replace(/\//g, ""))
        .join("/");
    }

    // TODO: finish implementing (use address standardization)
    throw "oops";
  } catch (e) {
    return `-/${cleanedAddressAst.children
      .map((node) =>
        node.nodeType === "word" && node.wordType === "unclassified"
          ? node.value[0]
          : null,
      )
      .filter((firstLetter) => Boolean(firstLetter))
      .join("-")}`;
  }
};
