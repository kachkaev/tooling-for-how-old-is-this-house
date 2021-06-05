import { AddressInterpretationError } from "./AddressInterpretationError";
import { commonUnclassifiedWordConfigLookup } from "./helpersForCommonUnclassifiedWords";
import { getDesignationConfig } from "./helpersForDesignations";
import {
  AddressNodeWithSeparator,
  AddressNodeWithWord,
  AddressSection,
  CleanedAddressAst,
  Designation,
} from "./types";

const isSpecificDesignation = (
  node: AddressNodeWithWord,
  designations: Designation[],
): boolean => {
  if (node.wordType !== "designation") {
    return false;
  }
  const { designation } = getDesignationConfig(node);

  return designations.includes(designation);
};

export const extractSections = (
  cleanedAddressAst: CleanedAddressAst,
): AddressSection[] => {
  const nodes = cleanedAddressAst.children;

  const sections: AddressSection[] = [];
  let forceClosePreviousSection: boolean = false;
  let currentSectionWords: AddressNodeWithWord[] = [];
  let currentDesignation: Designation | undefined = undefined;
  let lastUsedSeparator: AddressNodeWithSeparator | undefined = undefined;

  for (let nodeIndex = 0; nodeIndex <= nodes.length; nodeIndex += 1) {
    const node = nodes[nodeIndex];

    // close previous section
    if (!node || node.nodeType === "separator" || forceClosePreviousSection) {
      if (!currentSectionWords.length) {
        throw new AddressInterpretationError(
          `Unexpected empty section at index ${sections.length}`,
        );
      }

      sections.push({
        index: sections.length,
        words: currentSectionWords,
        designation: currentDesignation,
        separatorBefore: lastUsedSeparator,
      });

      lastUsedSeparator = node?.nodeType === "separator" ? node : undefined;

      if (forceClosePreviousSection) {
        nodeIndex -= 1;
      }
      forceClosePreviousSection = false;
      currentSectionWords = [];
      currentDesignation = undefined;

      continue;
    }

    // Prepare to close previous section
    if (
      // - after finding the second designation word (e.g. "улица" "тестовая" "дом")
      (node.wordType === "designation" && currentDesignation) ||
      // Before house and house parts
      (currentSectionWords.length > 0 &&
        isSpecificDesignation(node, ["house", "housePart"])) ||
      // - after finding a cardinal number following street or place (e.g. "улица" "тестовая" "10")
      (node.wordType === "cardinalNumber" &&
        currentDesignation &&
        currentDesignation !== "house" &&
        currentDesignation !== "housePart" &&
        // but not after designation being the only word in the section
        currentSectionWords.length > 1)
    ) {
      nodeIndex -= 1;
      forceClosePreviousSection = true;
      continue;
    }

    // Give up after seeing a word that cannot be in standardized address
    if (node.wordType === "unclassified") {
      const commonUnclassifiedWordConfig =
        commonUnclassifiedWordConfigLookup[node.value];

      if (commonUnclassifiedWordConfig?.canBeInStandardizedAddress === false) {
        throw new AddressInterpretationError(
          `Encountered a word that can’t be in standardized address: ${node.value}`,
        );
      }
    }

    // Give up if the address includes approximate referencing (e.g. ‘в районе’)
    if (node.wordType === "approximatePointer") {
      throw new AddressInterpretationError(
        "Unable to extract sections due to approximate referencing",
      );
    }

    // add word to current section
    currentSectionWords.push(node);
    if (node.wordType === "designation") {
      currentDesignation = getDesignationConfig(node).designation;
    }
  }

  return sections;
};
