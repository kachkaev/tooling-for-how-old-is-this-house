import {
  AddressNormalizationConfig,
  buildCleanedAddressAst,
  normalizeAddress,
} from "../../addresses";

export const addressIsGoodEnough = (
  normalizedAddress: string,
  addressNormalizationConfig: AddressNormalizationConfig,
  pickedStopWords: string[],
): boolean => {
  const cleanedAddressAst = buildCleanedAddressAst(
    normalizedAddress,
    addressNormalizationConfig,
  );

  if (
    cleanedAddressAst.children.some(
      (node) =>
        node.nodeType === "word" && pickedStopWords.includes(node.value),
    )
  ) {
    return false;
  }

  const autoencodedAddress = normalizeAddress(
    normalizedAddress,
    addressNormalizationConfig,
  );
  if (
    !autoencodedAddress ||
    autoencodedAddress?.toLowerCase() !== autoencodedAddress
  ) {
    return false;
  }

  return true;
};

const stopWords = [
  //
  "блок",
  "гараж",
  "место",
  "погреб",
  "сарай",
  "участок",
];

export const addressIsWorthKeepingInYandexCache = (
  normalizedAddress: string,
  addressNormalizationConfig: AddressNormalizationConfig,
): boolean =>
  addressIsGoodEnough(normalizedAddress, addressNormalizationConfig, stopWords);

const extendedStopWords = [...stopWords, "ст", "снт"];

export const addressIsWorthGeocodingWithYandex = (
  normalizedAddress: string,
  addressNormalizationConfig: AddressNormalizationConfig,
): boolean =>
  addressIsGoodEnough(
    normalizedAddress,
    addressNormalizationConfig,
    extendedStopWords,
  );
