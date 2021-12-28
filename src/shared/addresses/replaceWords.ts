import {
  AddressNodeWithSeparator,
  AddressNodeWithUnclassifiedWord,
  WordReplacementDirective,
  WordReplacementDirectiveTree,
} from "./types";

export const replaceWords = (
  nodes: Array<AddressNodeWithUnclassifiedWord | AddressNodeWithSeparator>,
  wordReplacementDirectiveTree: WordReplacementDirectiveTree | undefined,
): Array<AddressNodeWithUnclassifiedWord | AddressNodeWithSeparator> => {
  if (!wordReplacementDirectiveTree) {
    return nodes;
  }

  const processedNodes = [...nodes];
  for (let startIndex = 0; startIndex < nodes.length; startIndex += 1) {
    if (processedNodes[startIndex]?.nodeType !== "word") {
      continue;
    }
    const startWordFollowsWord =
      processedNodes[startIndex - 1]?.nodeType === "word";
    let currentTree: WordReplacementDirectiveTree | undefined =
      wordReplacementDirectiveTree;
    let pickedDirective: WordReplacementDirective | undefined;

    for (let index = startIndex; index < nodes.length; index += 1) {
      const node = processedNodes[index];
      if (node?.nodeType !== "word") {
        break;
      }
      currentTree = currentTree.subtreeByWordValue[node.value];
      if (!currentTree) {
        break;
      }

      const pickedDirectiveCandidate = currentTree.directive;
      if (!pickedDirectiveCandidate) {
        continue;
      }

      if (pickedDirectiveCandidate.detached) {
        const nextNode = processedNodes[index + 1];
        if (nextNode?.nodeType === "word" || startWordFollowsWord) {
          continue;
        }
      }

      pickedDirective = pickedDirectiveCandidate;
      if (pickedDirective.detached) {
        break;
      }
    }

    if (pickedDirective) {
      processedNodes.splice(
        startIndex,
        pickedDirective.from.length,
        ...pickedDirective.to,
      );
    }
  }

  return processedNodes;
};
