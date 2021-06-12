import { ReportIssue } from "../issues";
import { extractUnclassifiedWordsWithPunctuation } from "./extractUnclassifiedWordsWithPunctuation";
import { wordReplacementConfigsForDesignations } from "./helpersForDesignations";
import { wordReplacementConfigsForRegions } from "./helpersForRegions";
import { printCleanedAddressAst } from "./printCleanedAddressAst";
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

  if (printedWords !== text) {
    reportIssue?.(
      `Please replace "${text}" with "${printedWords}" (provided value is not normalized)`,
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
    for (const wordReplacementFrom of wordReplacement.from instanceof Array
      ? wordReplacement.from
      : [wordReplacement.from]) {
      const fromWords = extractAndValidateWordsInWordReplacementConfig(
        wordReplacementFrom,
        reportIssue,
      );
      const toWords = extractAndValidateWordsInWordReplacementConfig(
        wordReplacement.to,
        reportIssue,
      );

      if (!fromWords || !toWords) {
        continue;
      }

      if (!fromWords.length) {
        reportIssue?.(
          `Skipping "${wordReplacementFrom}" → "${wordReplacement.to}" because "from" contains no words`,
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
