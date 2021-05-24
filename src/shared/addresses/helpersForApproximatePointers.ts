import { generateWordConfigLookup } from "./helpersForWords";
import {
  AddressNodeWithApproximatePointer,
  ApproximatePointerConfig,
} from "./types";

// prettier-ignore
const approximatePointerConfigs: ApproximatePointerConfig[] = [
  { normalizedValue: "блокпост" }, // без названия
  { normalizedValue: "б/н", aliases: ["бн"] }, // без названия
  { normalizedValue: "километр", aliases: ["км"] },
  { normalizedValue: "микрорайоне", prepositionBefore: "в" },
  { normalizedValue: "направлении", prepositionBefore: "в" },
  { normalizedValue: "около" },
  { normalizedValue: "относительно" },
  { normalizedValue: "по" }, // с ... по / по улице
  { normalizedValue: "примерно" },
  { normalizedValue: "районе", prepositionBefore: "в", aliases: ["р-не"] },
  { normalizedValue: "расстоянии", prepositionBefore: "на" },
  { normalizedValue: "рядом", prepositionAfter: "с" },
  { normalizedValue: "территории", prepositionBefore: "на" },

  { normalizedValue: "восточнее" },
  { normalizedValue: "западнее" },
  { normalizedValue: "севернее" },
  { normalizedValue: "южнее" },

  { normalizedValue: "восточном", prepositionBefore: "в" },
  { normalizedValue: "западном", prepositionBefore: "в" },
  { normalizedValue: "северном", prepositionBefore: "в" },
  { normalizedValue: "северовосточном", prepositionBefore: "в" },
  { normalizedValue: "северозападном", prepositionBefore: "в" },
  { normalizedValue: "юговосточном", prepositionBefore: "в" },
  { normalizedValue: "югозападном", prepositionBefore: "в" },
  { normalizedValue: "южном", prepositionBefore: "в" },
  
  { normalizedValue: "восток", prepositionBefore: "на", prepositionAfter: 'от' },
  { normalizedValue: "запад", prepositionBefore: "на", prepositionAfter: 'от' },
  { normalizedValue: "север", prepositionBefore: "на", prepositionAfter: 'от' },
  { normalizedValue: "северовосток", aliases: ['северо-восток'], prepositionBefore: "на", prepositionAfter: 'от' },
  { normalizedValue: "северозапад", aliases: ['северо-запад'], prepositionBefore: "на", prepositionAfter: 'от' },
  { normalizedValue: "юг", prepositionBefore: "на", prepositionAfter: 'от' },
  { normalizedValue: "юговосток", aliases: ['юго-восток'], prepositionBefore: "на", prepositionAfter: 'от' },
  { normalizedValue: "югозапад", aliases: ['юго-запад'], prepositionBefore: "на", prepositionAfter: 'от' },
];

export const approximatePointerConfigLookup = generateWordConfigLookup({
  wordConfigs: approximatePointerConfigs,
  wordConfigsTitle: "approximatePointerConfigs",
});

export const getApproximatePointerConfig = (
  designationWord: AddressNodeWithApproximatePointer,
): ApproximatePointerConfig => {
  const approximatePointerConfig =
    approximatePointerConfigLookup[designationWord.value];
  if (!approximatePointerConfig) {
    throw new Error(
      `Unable to find approximatePointerConfig for ${designationWord.value}`,
    );
  }

  return approximatePointerConfig;
};
