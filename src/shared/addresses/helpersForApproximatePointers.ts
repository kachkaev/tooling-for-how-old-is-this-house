import {
  AddressNodeWithApproximatePointer,
  ApproximatePointerConfig,
} from "./types";

const approximatePointerConfigs: ApproximatePointerConfig[] = [
  { normalizedValue: "микрорайоне", prepositionBefore: "в" },
  { normalizedValue: "направлении", prepositionBefore: "в" },
  { normalizedValue: "около" },
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
];

export const approximatePointerConfigLookup: Record<
  string,
  ApproximatePointerConfig
> = {};

const addToLookup = (alias: string, config: ApproximatePointerConfig) => {
  if (approximatePointerConfigLookup[alias]) {
    throw new Error(
      `Duplicate entry in approximatePointerConfigLookup for ${alias}`,
    );
  }
  approximatePointerConfigLookup[alias] = config;
};

approximatePointerConfigs.forEach((approximatePointerConfig) => {
  addToLookup(
    approximatePointerConfig.normalizedValue,
    approximatePointerConfig,
  );
  approximatePointerConfig.aliases?.forEach((alias) => {
    addToLookup(alias, approximatePointerConfig);
  });
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
