import { AddressInterpretationError } from "./AddressInterpretationError";
import { getDesignationConfig } from "./helpersForDesignations";
import {
  AddressNodeWithWord,
  AddressSection,
  CleanedAddressAst,
  Designation,
} from "./types";

export const extractSections = (
  cleanedAddressAst: CleanedAddressAst,
): AddressSection[] => {
  const nodes = cleanedAddressAst.children;

  const sections: AddressSection[] = [];
  let forceClosePreviousSection: boolean = false;
  let currentSectionWords: AddressNodeWithWord[] = [];
  let currentDesignation: Designation | undefined = undefined;
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
      });
      if (forceClosePreviousSection) {
        nodeIndex -= 1;
      }
      forceClosePreviousSection = false;
      currentSectionWords = [];
      currentDesignation = undefined;

      continue;
    }

    // prepare to close previous section
    // - after finding the second designation word (e.g. "улица" "тестовая" "дом")
    // - after finding a cardinal number following street or place (e.g. "улица" "тестовая" "10")
    // - not after designation being the only word in the section
    if (
      (node.wordType === "designation" && currentDesignation) ||
      (node.wordType === "cardinalNumber" &&
        currentDesignation &&
        currentDesignation !== "house" &&
        currentDesignation !== "housePart" &&
        currentSectionWords.length > 1)
    ) {
      nodeIndex -= 1;
      forceClosePreviousSection = true;
      continue;
    }

    // add word to current section
    currentSectionWords.push(node);
    if (node.wordType === "designation") {
      currentDesignation = getDesignationConfig(node).designation;
    }
  }

  return sections;
};
