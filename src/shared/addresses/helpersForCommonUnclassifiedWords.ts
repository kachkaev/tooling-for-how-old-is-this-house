import { generateWordConfigLookup } from "./helpersForWords";
import { CommonUnclassifiedWordConfig } from "./types";

// prettier-ignore
const commonUnclassifiedWordConfigs: CommonUnclassifiedWordConfig[] = [
  { normalizedValue: "имени", aliases: ["им"], ignored: ["street"] },
  { normalizedValue: "завод", aliases: ["з-д"] },
  { normalizedValue: "завода", aliases: ["з-да"] },
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
];

export const commonUnclassifiedWordConfigLookup = generateWordConfigLookup({
  wordConfigs: commonUnclassifiedWordConfigs,
  wordConfigsTitle: "commonUnclassifiedWordConfigs",
});
