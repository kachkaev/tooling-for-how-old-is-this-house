import { autoExtendAliases } from "./helpersForSpelling";
import { CommonUnclassifiedWordConfig } from "./types";

const commonUnclassifiedWordConfigs: CommonUnclassifiedWordConfig[] = [
  { normalizedValue: "имени", aliases: ["им"], ignored: ["street"] },
  { normalizedValue: "завод", aliases: ["з-д"] },
  { normalizedValue: "завода", aliases: ["з-да"] },
];

export const commonUnclassifiedWordConfigLookup: Record<
  string,
  CommonUnclassifiedWordConfig
> = {};

const addToLookup = (alias: string, config: CommonUnclassifiedWordConfig) => {
  if (commonUnclassifiedWordConfigLookup[alias]) {
    throw new Error(
      `Duplicate entry in commonUnclassifiedWordConfigLookup for ${alias}`,
    );
  }
  commonUnclassifiedWordConfigLookup[alias] = config;
};

commonUnclassifiedWordConfigs.forEach((commonUnclassifiedWordConfig) => {
  autoExtendAliases(commonUnclassifiedWordConfig).forEach((alias) => {
    addToLookup(alias, commonUnclassifiedWordConfig);
  });
});
