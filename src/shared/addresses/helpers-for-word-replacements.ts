import { ReportIssue } from "../issues";
import { extractUnclassifiedWordsWithPunctuation } from "./extract-unclassified-words-with-punctuation";
import { wordReplacementConfigsForDesignations } from "./helpers-for-designations";
import { wordReplacementConfigsForRegions } from "./helpers-for-regions";
import { printCleanedAddressAst } from "./print-cleaned-address-ast";
import {
  AddressHandlingConfig,
  AddressNodeWithUnclassifiedWord,
  RawAddressHandlingConfig,
  WordReplacementConfig,
  WordReplacementDirective,
  WordReplacementDirectiveTree,
} from "./types";

export const matchWordSequence = (): boolean => {
  return true;
};

const extractAndValidateWordsInWordReplacementConfig = (
  text: string,
  reportIssue?: ReportIssue,
  silenceNormalizationWarning?: boolean,
): AddressNodeWithUnclassifiedWord[] | undefined => {
  const nodes = extractUnclassifiedWordsWithPunctuation(text);
  const words = nodes.filter(
    (node): node is AddressNodeWithUnclassifiedWord => node.nodeType === "word",
  );

  if (nodes.length !== words.length) {
    reportIssue?.(`Skipping "${text}" because it contains punctuation`);

    return undefined;
  }

  const printedWords = printCleanedAddressAst(
    {
      nodeType: "cleanedAddress",
      children: words,
    },
    (word) => word.value,
  );

  if (printedWords !== text && !silenceNormalizationWarning) {
    reportIssue?.(
      `Provided value "${text}" is not normalized. Please replace it with "${printedWords}" or add silenceNormalizationWarning: true to word replacement config`,
    );
  }

  return words;
};

const buildWordReplacementDirectiveTree = (
  wordReplacements: WordReplacementConfig[],
  reportIssue?: ReportIssue,
): WordReplacementDirectiveTree => {
  const wordReplacementDirectives: WordReplacementDirective[] = [];

  for (const wordReplacement of wordReplacements) {
    const wordReplacementFromValues = Array.isArray(wordReplacement.from)
      ? wordReplacement.from
      : [wordReplacement.from];

    for (const wordReplacementFromValue of wordReplacementFromValues) {
      const fromWords = extractAndValidateWordsInWordReplacementConfig(
        wordReplacementFromValue,
        reportIssue,
        wordReplacement.silenceNormalizationWarning,
      );
      const toWords = extractAndValidateWordsInWordReplacementConfig(
        wordReplacement.to,
        reportIssue,
        wordReplacement.silenceNormalizationWarning,
      );

      if (!fromWords || !toWords) {
        continue;
      }

      if (fromWords.length === 0) {
        reportIssue?.(
          `Skipping "${wordReplacementFromValue}" → "${wordReplacement.to}" because "from" contains no words`,
        );
        continue;
      }

      wordReplacementDirectives.push({
        detached: wordReplacement.detached ?? false,
        from: fromWords,
        to: toWords,
      });
    }
  }

  const treeRoot: WordReplacementDirectiveTree = {
    subtreeByWordValue: {},
  };

  for (const wordReplacementDirective of wordReplacementDirectives) {
    let currentTree = treeRoot;

    const lastWord =
      wordReplacementDirective.from[wordReplacementDirective.from.length - 1];

    if (!lastWord) {
      throw new Error(
        "Unexpected empty last word in wordReplacementDirective. This is a bug.",
      );
    }
    for (const word of wordReplacementDirective.from) {
      let subtree = currentTree.subtreeByWordValue[word.value];
      if (!subtree) {
        subtree = {
          subtreeByWordValue: {},
        };
        currentTree.subtreeByWordValue[word.value] = subtree;
      }
      currentTree = subtree;

      if (word === lastWord) {
        currentTree.directive = wordReplacementDirective;
      }
    }
  }

  return treeRoot;
};

export const compileAddressHandlingConfig = (
  rawAddressHandlingConfig: RawAddressHandlingConfig,
  reportIssue?: ReportIssue,
): AddressHandlingConfig => {
  const { wordReplacements, ...rest } = rawAddressHandlingConfig;

  return {
    ...rest,
    wordReplacementDirectiveTree: buildWordReplacementDirectiveTree(
      [
        ...wordReplacementConfigsForDesignations,
        ...wordReplacementConfigsForRegions,
        ...(wordReplacements ?? []),
      ],
      reportIssue,
    ),
  };
};
