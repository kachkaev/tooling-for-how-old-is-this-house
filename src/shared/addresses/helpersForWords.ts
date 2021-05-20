import { WordConfig } from "./types";

const generateAliasesWithLatinLetters = (alias: string): string[] => {
  // TODO: Improve logic to handle more cases
  const aliasWithLatinC = alias.replace("с", "c");
  if (aliasWithLatinC !== alias) {
    return [aliasWithLatinC];
  }

  return [];
};

const autoExtendAliases = (aliases: string[]): string[] => {
  const variousSpellings = aliases.flatMap((alias) => [
    alias,
    ...generateAliasesWithLatinLetters(alias),
  ]);

  return variousSpellings.flatMap((spelling) => [spelling, `${spelling}.`]);
};

const wordConfigsTitleByAlias: Record<string, string> = {};

export const generateWordConfigLookup = <C extends Partial<WordConfig>>({
  wordConfigs,
  wordConfigsTitle,
  getCustomAliases,
}: {
  wordConfigs: C[];
  wordConfigsTitle: string;
  getCustomAliases?: (c: C) => string[];
}): Record<string, C> => {
  const wordLookup: Record<string, C> = {};

  const addToLookup = (alias: string, config: C) => {
    if (wordLookup[alias]) {
      throw new Error(`Duplicate entry in ${wordConfigsTitle} for ${alias}`);
    }
    wordLookup[alias] = config;

    const priorUsage = wordConfigsTitleByAlias[alias];
    if (priorUsage) {
      throw new Error(
        `Dual-usage of entry ${alias} in ${priorUsage} and ${wordConfigsTitle}`,
      );
    }
    wordConfigsTitleByAlias[alias] = wordConfigsTitle;
  };

  wordConfigs.forEach((wordConfig) => {
    const allAliases: string[] = [];
    if (wordConfig.aliases) {
      allAliases.push(...wordConfig.aliases);
    }
    if (wordConfig.normalizedValue) {
      allAliases.push(wordConfig.normalizedValue);
    }
    if (getCustomAliases) {
      allAliases.push(...getCustomAliases(wordConfig));
    }

    autoExtendAliases(allAliases).forEach((alias) => {
      addToLookup(alias, wordConfig);
    });
  });

  return wordLookup;
};
