import { generateWordConfigLookup } from "./helpersForWords";
import { CommonUnclassifiedWordConfig } from "./types";

// prettier-ignore
export const commonUnclassifiedWordConfigs: CommonUnclassifiedWordConfig[] = [
  { normalizedValue: "завод", aliases: ["з-д"] },
  { normalizedValue: "завода", aliases: ["з-да"] },
  { normalizedValue: "имени", aliases: ["им"], ignored: ["street"] },
  { normalizedValue: "комбинат", aliases: ["к-т"] },
  { normalizedValue: "вч", aliases: ["в/ч"], canBeInStandardizedAddress: false },
  { normalizedValue: "гск", aliases: ["гк"], canBeInStandardizedAddress: false },
  { normalizedValue: "гаражный", canBeInStandardizedAddress: false },
  { normalizedValue: "кооператив", canBeInStandardizedAddress: false },
  { normalizedValue: "квартал", canBeInStandardizedAddress: false }, // in allotments
  
  { normalizedValue: "i", canBeInStandardizedAddress: false },
  { normalizedValue: "ii", canBeInStandardizedAddress: false },
  { normalizedValue: "iii", canBeInStandardizedAddress: false },
  { normalizedValue: "iv", canBeInStandardizedAddress: false },
  { normalizedValue: "v", canBeInStandardizedAddress: false },
  { normalizedValue: "vi", canBeInStandardizedAddress: false },
  { normalizedValue: "vii", canBeInStandardizedAddress: false },
  { normalizedValue: "viii", canBeInStandardizedAddress: false },
  { normalizedValue: "ix", canBeInStandardizedAddress: false },
  { normalizedValue: "x", canBeInStandardizedAddress: false },

  // Prevent upper case
  { normalizedValue: "дивизии" },
];

export const commonUnclassifiedWordConfigLookup = generateWordConfigLookup({
  wordConfigs: commonUnclassifiedWordConfigs,
  wordConfigsTitle: "commonUnclassifiedWordConfigs",
});
