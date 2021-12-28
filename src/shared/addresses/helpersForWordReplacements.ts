import _ from "lodash";

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

      if (!fromWords.length) {
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

const sanitizeWordReplacements = (
  rawWordReplacements: unknown,
  reportIssue?: ReportIssue,
): WordReplacementConfig[] => {
  if (!Array.isArray(rawWordReplacements)) {
    if (typeof rawWordReplacements !== "undefined") {
      reportIssue?.(
        `Expected word replacements to be an array, got ${typeof rawWordReplacements}`,
      );
    }

    return [];
  }
  const result: WordReplacementConfig[] = [];

  for (const rawWordReplacement of rawWordReplacements as unknown[]) {
    const stringifiedRawWordReplacement = JSON.stringify(rawWordReplacement);

    if (
      !_.isObject(rawWordReplacement) ||
      !("from" in rawWordReplacement) ||
      !("to" in rawWordReplacement)
    ) {
      reportIssue?.(
        `Skipping word replacement ${stringifiedRawWordReplacement} (expected an object with "from" and "to" keys)`,
      );
      continue;
    }

    const {
      detached,
      from,
      to,
      silenceNormalizationWarning,
    } = rawWordReplacement as Record<string, unknown>;

    if (typeof to !== "string") {
      reportIssue?.(
        `Skipping word replacement ${stringifiedRawWordReplacement} (expected "to" to be a string)`,
      );
      continue;
    }

    if (typeof from !== "string" && !Array.isArray(from)) {
      reportIssue?.(
        `Skipping word replacement ${stringifiedRawWordReplacement} (expected "from" to be a string or an array of strings)`,
      );
      continue;
    }

    let sanitizedFrom = from;
    if (Array.isArray(from)) {
      sanitizedFrom = [];
      for (const fromElement of from) {
        if (typeof fromElement !== "string") {
          reportIssue?.(
            `Skipping from ${JSON.stringify(
              fromElement,
            )} in ${stringifiedRawWordReplacement} (expected a string)`,
          );
        } else {
          sanitizedFrom.push(fromElement);
        }
      }
    }

    if (typeof detached !== "undefined" && typeof detached !== "boolean") {
      reportIssue?.(
        `Skipping word replacement ${stringifiedRawWordReplacement} (expected "detached" to be a boolean)`,
      );
      continue;
    }

    if (
      typeof silenceNormalizationWarning !== "undefined" &&
      typeof silenceNormalizationWarning !== "boolean"
    ) {
      reportIssue?.(
        `Skipping word replacement ${stringifiedRawWordReplacement} (expected "silenceNormalizationWarning" to be a boolean)`,
      );
      continue;
    }

    result.push({
      detached,
      from: sanitizedFrom,
      silenceNormalizationWarning,
      to,
    });
  }

  return result;
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
        ...sanitizeWordReplacements(wordReplacements, reportIssue),
      ],
      reportIssue,
    ),
  };
};
