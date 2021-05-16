import {
  AddressNormalizationConfig,
  buildCleanedAddressAst,
  buildStandardizedAddressAst,
} from "../../addresses";

export const addressIsWorthKeepingInYandexCache = (
  normalizedAddress: string,
  addressNormalizationConfig: AddressNormalizationConfig,
): boolean => {
  try {
    // TODO: improve logic
    if (
      normalizedAddress.includes(" гараж ") ||
      normalizedAddress.includes(" место ") ||
      normalizedAddress.includes(" участок ") ||
      normalizedAddress.includes(" гск ") ||
      normalizedAddress.includes(" гск, ") ||
      normalizedAddress.includes(" кооператив") ||
      normalizedAddress.includes("километр") ||
      normalizedAddress.includes("территория") ||
      normalizedAddress.includes(" блок ")
    ) {
      throw new Error("stop word");
    }
    buildStandardizedAddressAst(
      buildCleanedAddressAst(normalizedAddress),
      addressNormalizationConfig,
    );
  } catch {
    return false;
  }

  return true;
};

export const addressIsWorthGeocodingWithYandex = (
  normalizedAddress: string,
  addressNormalizationConfig: AddressNormalizationConfig,
): boolean => {
  if (
    !addressIsWorthKeepingInYandexCache(
      normalizedAddress,
      addressNormalizationConfig,
    )
  ) {
    return false;
  }

  return (
    !normalizedAddress.includes(" ст ") && !normalizedAddress.includes(" снт ")
  );
};
