const generateAliasesWithLatinLetters = (alias: string): string[] => {
  // TODO: Improve logic to handle more cases
  const aliasWithLatinC = alias.replace("с", "c");
  if (aliasWithLatinC !== alias) {
    return [aliasWithLatinC];
  }

  return [];
};

export const autoExtendAliases = (config: {
  normalizedValue: string;
  aliases?: readonly string[];
}): string[] => {
  const allAliases = [config.normalizedValue, ...(config.aliases ?? [])];

  const variousSpellings = allAliases.flatMap((alias) => [
    alias,
    ...generateAliasesWithLatinLetters(alias),
  ]);

  return variousSpellings.flatMap((spelling) => [spelling, `${spelling}.`]);
};
