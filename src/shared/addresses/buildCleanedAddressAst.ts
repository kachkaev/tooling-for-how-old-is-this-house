import { extractUnclassifiedWordsWithPunctuation } from "./extractUnclassifiedWordsWithPunctuation";
import {
  approximatePointerConfigLookup,
  getApproximatePointerConfig,
} from "./helpersForApproximatePointers";
import { commonUnclassifiedWordConfigLookup } from "./helpersForCommonUnclassifiedWords";
import {
  designationAdjectiveConfigLookup,
  isNormalizedDesignationAdjective,
} from "./helpersForDesignationAdjectives";
import {
  designationConfigLookup,
  getDesignationConfig,
} from "./helpersForDesignations";
import {
  ordinalNumberEndingConfigLookup,
  ordinalNumberTextualNotationConfigLookup,
} from "./helpersForOrdinalNumbers";
import { replaceWords } from "./replaceWords";
import {
  AddressCleaningConfig,
  AddressNodeWithApproximatePointer,
  AddressNodeWithDesignation,
  AddressNodeWithNumber,
  AddressNodeWithUnclassifiedWord,
  AddressNodeWithWord,
  CleanedAddressAst,
  CleanedAddressNode,
  DesignationConfig,
} from "./types";

const isUnclassifiedWord = (
  node?: CleanedAddressNode,
): node is AddressNodeWithUnclassifiedWord =>
  !!node && node.nodeType === "word" && node.wordType === "unclassified";

const isDesignation = (
  node?: CleanedAddressNode,
): node is AddressNodeWithDesignation =>
  !!node && node.nodeType === "word" && node.wordType === "designation";

const isApproximatePointer = (
  node?: CleanedAddressNode,
): node is AddressNodeWithApproximatePointer =>
  !!node && node.nodeType === "word" && node.wordType === "approximatePointer";

const canBeInitial = (
  node?: CleanedAddressNode,
): node is AddressNodeWithUnclassifiedWord =>
  isUnclassifiedWord(node) &&
  (node.value.length === 1 ||
    (node.value.length === 2 && node.value[1] === "."));

const canHaveDesignationAdjective = (
  node?: CleanedAddressNode,
): node is AddressNodeWithUnclassifiedWord =>
  isUnclassifiedWord(node) && Boolean(node.value.match(/(ая|ый|ое|нка|вка)$/));

const findRelevantDesignation = (
  nodes: CleanedAddressNode[],
  node: CleanedAddressNode,
): DesignationConfig | undefined => {
  const nodeIndex = nodes.indexOf(node);

  // look left
  for (let index = nodeIndex - 1; index >= 0; index -= 1) {
    const nodeAtIndex = nodes[index]!;
    if (nodeAtIndex.nodeType === "separator") {
      break;
    }
    if (nodeAtIndex.wordType === "designation") {
      return designationConfigLookup[nodeAtIndex.value];
    }
  }

  // look right
  for (let index = nodeIndex + 1; index < nodes.length; index += 1) {
    const nodeAtIndex = nodes[index]!;
    if (nodeAtIndex.nodeType === "separator") {
      break;
    }
    if (nodeAtIndex.wordType === "designation") {
      return designationConfigLookup[nodeAtIndex.value];
    }
  }

  return undefined;
};

const removeRedundantSeparators = (
  nodes: CleanedAddressNode[],
): CleanedAddressNode[] => {
  const resultingNodes: CleanedAddressNode[] = [...nodes];
  while (resultingNodes[0]?.nodeType === "separator") {
    resultingNodes.shift();
  }
  while (resultingNodes[resultingNodes.length - 1]?.nodeType === "separator") {
    resultingNodes.pop();
  }

  for (let index = resultingNodes.length - 1; index >= 0; index -= 1) {
    if (
      resultingNodes[index]?.nodeType === "separator" &&
      resultingNodes[index - 1]?.nodeType === "separator"
    ) {
      resultingNodes.splice(index, 1);
    }
  }

  return resultingNodes;
};

export const buildCleanedAddressAst = (
  rawAddress: string,
  config: AddressCleaningConfig,
): CleanedAddressAst => {
  const nodesBeforeReplacements = extractUnclassifiedWordsWithPunctuation(
    rawAddress,
  );

  const [...nodes]: CleanedAddressNode[] = removeRedundantSeparators(
    replaceWords(nodesBeforeReplacements, config.wordReplacementDirectiveTree),
  );

  // Replace ordinal number textual notations (e.g. первый → 1-й) {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node?.nodeType !== "word" || node.wordType !== "unclassified") {
      continue;
    }
    const ordinalNumberTextualNotationConfig =
      ordinalNumberTextualNotationConfigLookup[node.value];

    if (
      !ordinalNumberTextualNotationConfig ||
      ordinalNumberTextualNotationConfig.normalizedValue === node.value
    ) {
      continue;
    }

    node.value = ordinalNumberTextualNotationConfig.normalizedValue;
  }

  // Find words that start with digits, treat all as unclassified numbers for now
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]!;
    if (node.nodeType !== "word" || node.wordType !== "unclassified") {
      continue;
    }
    const match = node.value.match(/^(\d+)([^.]*).?$/);
    if (!match) {
      continue;
    }
    const [, rawNumber = "", ending = ""] = match;
    const updatedNode = (node as AddressNodeWithWord) as AddressNodeWithNumber;
    updatedNode.wordType = "unclassifiedNumber";
    updatedNode.number = parseInt(rawNumber);
    updatedNode.value = `${rawNumber}${ending}`;
    updatedNode.ending = ending;
  }

  // Detach endings from unclassifiedNumber words in cases like ‘10корп’ (but not ‘10-летия’ or 10й)
  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    const node = nodes[index]!;
    if (node.nodeType !== "word" || node.wordType !== "unclassifiedNumber") {
      continue;
    }
    if (node.ending.length > 1 && node.ending[0] !== "-") {
      nodes.splice(index + 1, 0, {
        nodeType: "word",
        wordType: "unclassified",
        value: node.ending,
      });
      node.ending = "";
      node.value = `${node.number}`;
    }
  }

  // Attach ending to numbers, e.g. ‘10 Б’ or ‘10 Б.’
  for (let index = nodes.length - 2; index >= 0; index -= 1) {
    const node = nodes[index]!;
    if (
      node.nodeType !== "word" ||
      node.wordType !== "unclassifiedNumber" ||
      node.ending.length
    ) {
      continue;
    }

    const nextNode = nodes[index + 1]!;
    if (nextNode.nodeType !== "word" || nextNode.wordType !== "unclassified") {
      continue;
    }

    let ending = nextNode.value;
    if (ending.length === 2 && ending[1] === ".") {
      ending = ending.slice(0, 1);
    }

    if (ending.length > 1) {
      continue;
    }

    const nextNode2 = nodes[index + 2];
    if (
      nextNode2 &&
      nextNode2.nodeType === "word" &&
      nextNode2.wordType === "unclassifiedNumber"
    ) {
      continue;
    }

    nodes.splice(index + 1, 1);
    node.value += ending;
    node.ending = ending;
  }

  // Classify numbers
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node?.nodeType !== "word" || node.wordType !== "unclassifiedNumber") {
      continue;
    }

    const endingStartsWithDash = node.ending?.startsWith("-");
    const endingWithoutDash = endingStartsWithDash
      ? node.ending.slice(1)
      : node.ending;

    const ordinalNumberEndingConfig =
      ordinalNumberEndingConfigLookup[node.ending];

    if (ordinalNumberEndingConfig) {
      const normalizedEnding = ordinalNumberEndingConfig.normalizedValue;
      node.wordType = "ordinalNumber";
      node.value = `${node.number}${normalizedEnding}`;
      node.ending = normalizedEnding;
      continue;
    }

    if (endingWithoutDash.length < 2) {
      node.wordType = "cardinalNumber";
      node.value = `${node.number}${endingWithoutDash}`;
      node.ending = endingWithoutDash;
      continue;
    }
  }

  // Convert dash into a comma if it is not between two cardinal numbers
  for (let index = 1; index < nodes.length - 1; index += 1) {
    const node = nodes[index]!;
    if (node.nodeType !== "separator" || node.separatorType !== "dash") {
      continue;
    }

    const prevNode = nodes[index - 1]!;
    const nextNode = nodes[index + 1]!;
    if (
      prevNode.nodeType !== "word" ||
      prevNode.wordType !== "cardinalNumber" ||
      nextNode.nodeType !== "word" ||
      nextNode.wordType !== "cardinalNumber"
    ) {
      node.separatorType = "comma";
    }
  }

  // Find initials (И. О.)
  for (let index = 0; index < nodes.length - 2; index += 1) {
    const node1 = nodes[index];
    const node2 = nodes[index + 1];
    const node3 = nodes[index + 2];

    if (
      canBeInitial(node1) &&
      canBeInitial(node2) &&
      isUnclassifiedWord(node3)
    ) {
      (node1 as AddressNodeWithWord).wordType = "initial";
      (node2 as AddressNodeWithWord).wordType = "initial";
      node1.value = `${node1.value[0]}.`;
      node2.value = `${node2.value[0]}.`;
    }
  }

  // Find designations
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (!isUnclassifiedWord(node)) {
      continue;
    }

    const prevNode = nodes[index - 1];
    const nextNode = nodes[index + 1];
    if (isDesignation(prevNode)) {
      if (canBeInitial(node) && isUnclassifiedWord(nextNode)) {
        continue;
      }
      if (getDesignationConfig(prevNode).designation === "housePart") {
        continue;
      }
    }

    const designationConfig = designationConfigLookup[node.value];
    if (!designationConfig) {
      continue;
    }
    const updatedNode = (node as AddressNodeWithWord) as AddressNodeWithDesignation;
    updatedNode.wordType = "designation";
    updatedNode.value = designationConfig.normalizedValue;
  }

  // Find approximate pointers
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (!isUnclassifiedWord(node)) {
      continue;
    }

    const approximatePointerConfig = approximatePointerConfigLookup[node.value];
    if (!approximatePointerConfig) {
      continue;
    }

    if (approximatePointerConfig.prepositionBefore) {
      const prevNode = nodes[index - 1];
      if (
        prevNode?.nodeType !== "word" ||
        prevNode.value !== approximatePointerConfig.prepositionBefore
      ) {
        continue;
      }
    }

    if (approximatePointerConfig.prepositionAfter) {
      const nextNode = nodes[index + 1];
      if (
        nextNode?.nodeType !== "word" ||
        nextNode.value !== approximatePointerConfig.prepositionAfter
      ) {
        continue;
      }
    }

    const updatedNode = (node as AddressNodeWithWord) as AddressNodeWithApproximatePointer;
    updatedNode.wordType = "approximatePointer";
    updatedNode.value = approximatePointerConfig.normalizedValue;
  }

  // Find single initials (И.)
  for (let index = 0; index < nodes.length - 3; index += 1) {
    const node1 = nodes[index];
    const node2 = nodes[index + 1];
    const node3 = nodes[index + 2];

    if (!canBeInitial(node2)) {
      continue;
    }

    if (
      (isApproximatePointer(node3) &&
        getApproximatePointerConfig(node3).prepositionBefore === node2.value) ||
      (isApproximatePointer(node1) &&
        getApproximatePointerConfig(node1).prepositionAfter === node2.value)
    ) {
      continue;
    }

    if (isDesignation(node1)) {
      if (!isUnclassifiedWord(node3) || canHaveDesignationAdjective(node3)) {
        continue;
      }
      if (getDesignationConfig(node1).designation === "housePart") {
        continue;
      }

      (node2 as AddressNodeWithWord).wordType = "initial";
      node2.value = `${node2.value[0]}.`;
    }
  }

  // Expand designation adjectives (мал. → малый)
  for (const node of nodes) {
    if (!isUnclassifiedWord(node)) {
      continue;
    }

    const designationAdjectiveConfig =
      designationAdjectiveConfigLookup[node.value];
    if (!designationAdjectiveConfig) {
      continue;
    }

    const designationConfig = findRelevantDesignation(nodes, node);
    if (!designationConfig || designationConfig.designation === "housePart") {
      continue;
    }

    (node as AddressNodeWithWord).wordType = "designationAdjective";
    if (isNormalizedDesignationAdjective(node.value)) {
      continue;
    }

    node.value =
      designationAdjectiveConfig.normalizedValueByGender[
        designationConfig.gender
      ];
  }

  // Process unclassified words
  for (const node of nodes) {
    if (!isUnclassifiedWord(node)) {
      continue;
    }
    // If it is a commonly known word, replace with normalized spelling
    const commonUnclassifiedWordConfig =
      commonUnclassifiedWordConfigLookup[node.value];
    if (commonUnclassifiedWordConfig) {
      node.value = commonUnclassifiedWordConfig.normalizedValue;
      continue;
    }

    // Remove . at the end
    if (node.value.endsWith(".")) {
      node.value = node.value.slice(0, -1);
    }
  }

  // Mark designation as an unclassified word if canBePartOfName and next to another designation word
  let previouslySeenDesignationInThisSection:
    | AddressNodeWithWord
    | undefined = undefined;
  let previouslySeenDesignationConfigInThisSection:
    | DesignationConfig
    | undefined = undefined;

  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (node?.nodeType === "separator" && node.separatorType !== "dash") {
      previouslySeenDesignationInThisSection = undefined;
      previouslySeenDesignationConfigInThisSection = undefined;
      continue;
    }

    if (!isDesignation(node)) {
      continue;
    }

    const designationConfig = designationConfigLookup[node.value];
    if (!designationConfig) {
      throw new Error(
        `Unexpectedly undefined designation config for ${node.value} (this is a bug)`,
      );
    }

    if (!previouslySeenDesignationInThisSection) {
      previouslySeenDesignationInThisSection = node;
      previouslySeenDesignationConfigInThisSection = designationConfig;
      continue;
    }

    if (
      previouslySeenDesignationInThisSection &&
      previouslySeenDesignationConfigInThisSection
    ) {
      if (previouslySeenDesignationConfigInThisSection.canBePartOfName) {
        (previouslySeenDesignationInThisSection as AddressNodeWithWord).wordType =
          "unclassified";
      } else if (designationConfig.canBePartOfName) {
        (node as AddressNodeWithWord).wordType = "unclassified";
      }
    }
  }

  // The address can contain an ordinal number like 42-Е, which should be a cardinal number.
  // We only make the ordinal number cardinal if
  // - it is surrounded by separators
  // - comes after house designation
  // - comes before ‘строение’
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];

    if (
      node?.nodeType !== "word" ||
      node.wordType !== "ordinalNumber" ||
      node.ending.length !== 2
    ) {
      continue;
    }

    const prevNode = nodes[i - 1];
    if (
      prevNode?.nodeType === "word" &&
      (!isDesignation(prevNode) ||
        (getDesignationConfig(prevNode).designation !== "house" &&
          prevNode.value !== "строение"))
    ) {
      continue;
    }

    const nextNode = nodes[i + 1];
    if (nextNode?.nodeType === "word" && nextNode.value !== "строение") {
      continue;
    }

    node.wordType = "cardinalNumber";
    node.ending = node.ending.slice(1);
    node.value = `${node.number}${node.ending}`;
  }

  return {
    nodeType: "cleanedAddress",
    children: nodes,
  };
};
