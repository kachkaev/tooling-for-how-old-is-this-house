import { AddressInterpretationError } from "./AddressInterpretationError";
import { buildCleanedAddressAst } from "./buildCleanedAddressAst";
import { convertSectionToSemanticPart } from "./convertSectionToSemanticPart";
import { extractSections } from "./extractSections";
import { getDesignationConfig } from "./helpersForDesignations";
import { resolveRegionCode } from "./helpersForRegions";
import {
  AddressNodeWithWord,
  AddressSection,
  AddressStandardizationConfig,
  CleanedAddressAst,
  StandardizedAddressAst,
} from "./types";

export const buildStandardizedAddressAst = (
  cleanedAddressAst: CleanedAddressAst,
  config: AddressStandardizationConfig,
): StandardizedAddressAst => {
  const sections = extractSections(cleanedAddressAst);

  let region: StandardizedAddressAst["region"] | undefined;
  let settlement: StandardizedAddressAst["settlement"] | undefined;
  let streets: StandardizedAddressAst["streets"] | undefined;
  let houses: StandardizedAddressAst["houses"] | undefined;
  let housePart: StandardizedAddressAst["housePart"] | undefined;

  const houseSections: AddressSection[] = [];
  const housePartSections: AddressSection[] = [];

  for (
    let sectionIndex = 0;
    sectionIndex < sections.length;
    sectionIndex += 1
  ) {
    const section = sections[sectionIndex]!;

    // Ignore post code
    if (
      section.words.length === 1 &&
      section.words[0]?.wordType === "postCode"
    ) {
      continue;
    }

    // Special case: cardinal number in first section is region code, if not followed by street / place
    if (
      sectionIndex === 0 &&
      !section.designation &&
      section.words.length === 1 &&
      section.words[0]?.wordType === "cardinalNumber" &&
      sections[1]?.designation !== "street" &&
      sections[1]?.designation !== "place"
    ) {
      region = resolveRegionCode(section.words[0].value);
      continue;
    }

    // Ignore misc territorial divisions
    // TODO: Consider including these sections for better coverage
    if (
      section.designation === "district" ||
      section.designation === "county"
    ) {
      continue;
    }

    // Ignore insignificant house parts
    if (section.designation === "housePart") {
      const designationWordValue = section.words.find(
        (word) => word.wordType === "designation",
      )?.value;

      if (
        designationWordValue === "гараж" ||
        designationWordValue === "квартира" ||
        designationWordValue === "сарай"
      ) {
        continue;
      }

      // Common special case: ‘стр’ (‘строение‘, can also mean ‘строящийся’)
      if (designationWordValue === "строение") {
        // If at the end of the address
        // → ignore this section
        if (
          section.words.length === 1 &&
          sectionIndex === sections.length - 1
        ) {
          continue;
        }

        // If there is no other section that can be treated as house
        // → remove word
        if (houseSections.length === 0) {
          houseSections.push({
            index: section.index,
            words: section.words.filter((word) => word.value !== "строение"),
          });
          continue;
        }
      }
    }

    // Stop if the only word in the section is designation (does not make sense)
    if (section.words.length === 1 && section.designation) {
      const word = section.words[0]!;
      if (word.wordType !== "designation") {
        throw new Error(
          `Unexpected word of type ${word.wordType} in a section with a single designation word`,
        );
      }

      // special case: "территория гск", "территория снт", "аал снт" (→ "ст снт") etc.
      if (getDesignationConfig(word).canBeSkippedIfAloneInSection) {
        continue;
      }

      throw new AddressInterpretationError(
        `Unexpected section only with designation: ${word.value}`,
      );
    }

    // Region
    if (section.designation === "region") {
      if (region) {
        throw new AddressInterpretationError(
          "Did not expect more than one region",
        );
      }
      region = convertSectionToSemanticPart(section);
      continue;
    }

    // Settlement (designation is explicit)
    if (section.designation === "settlement") {
      if (settlement) {
        throw new AddressInterpretationError(
          "Did not expect more than one settlement",
        );
      }
      settlement = convertSectionToSemanticPart(section);
      continue;
    }

    // Settlement (designation is omitted)
    if (
      !section.designation &&
      !section.words.some((word) => word.wordType === "cardinalNumber")
    ) {
      if (settlement) {
        throw new AddressInterpretationError(
          "Did not expect more than one settlement",
        );
      }
      settlement = convertSectionToSemanticPart(section);
      continue;
    }

    // Place (settlement or street)
    if (section.designation === "place") {
      if (!settlement) {
        settlement = convertSectionToSemanticPart(section);
      } else if (!streets) {
        streets = [convertSectionToSemanticPart(section)];
      } else {
        streets.push(convertSectionToSemanticPart(section));
      }
      continue;
    }

    // Street
    if (section.designation === "street") {
      if (streets) {
        streets.push(convertSectionToSemanticPart(section));
        continue;
      }

      streets = [convertSectionToSemanticPart(section)];
      continue;
    }

    // House
    if (
      section.designation === "house" ||
      (!section.designation && section.words.length === 1)
    ) {
      houseSections.push(section);
      continue;
    }

    // Rest (house part)
    housePartSections.push(section);
  }

  let prevHouseSection: AddressSection | undefined;
  for (const houseSection of houseSections) {
    let wordsToAdd = [...houseSection.words];
    const firstWordInSection = houseSection.words[0];

    // Remove house designation word
    if (
      firstWordInSection?.wordType === "designation" &&
      getDesignationConfig(firstWordInSection).designation === "house"
    ) {
      // if designation is not followed by a number, fail (e.g. typos like ‘уч. Мясницкая’)
      const nextWord = wordsToAdd[1];
      if (
        nextWord?.nodeType !== "word" ||
        nextWord.wordType !== "cardinalNumber"
      ) {
        throw new AddressInterpretationError(
          `Expected cardinal number after "${firstWordInSection.value}", got ${
            nextWord ? `"${nextWord.value}"` : "end of section"
          }`,
        );
      }
      wordsToAdd = wordsToAdd.slice(1);
    }

    const [firstWord, ...otherWords] = wordsToAdd;
    if (!firstWord || otherWords.length > 0) {
      throw new AddressInterpretationError(
        `Expected house section to consist of one word, got ${wordsToAdd.length}`,
      );
    }

    const separatedBySlash =
      houseSection.separatorBefore?.separatorType === "slash";
    const followsAnotherHouseSection =
      prevHouseSection?.index === houseSection.index - 1;

    if (separatedBySlash && !followsAnotherHouseSection) {
      throw new AddressInterpretationError(
        "Expected slash after another house number",
      );
    }
    if (!separatedBySlash && followsAnotherHouseSection) {
      throw new AddressInterpretationError(
        "Expected slash between subsequent house numbers",
      );
    }

    prevHouseSection = houseSection;

    if (!houses) {
      houses = [
        {
          nodeType: "semanticPart",
          orderedWords: [firstWord],
        },
      ];
    } else {
      houses.push({
        nodeType: "semanticPart",
        orderedWords: [firstWord],
      });
    }
  }

  // Assemble housePart out of the remaining sections
  if (housePartSections.length > 0) {
    for (
      let sectionIndex = 0;
      sectionIndex < housePartSections.length;
      sectionIndex += 1
    ) {
      const section = housePartSections[sectionIndex];
      const prevSection = housePartSections[sectionIndex - 1];

      if (!section) {
        throw new Error("Unexpected empty section in a loop");
      }

      const cardinalNumberNodes = section.words.filter(
        (word) => word.wordType === "cardinalNumber",
      );

      // Ensure section does not start with a number (could be the case of enumeration like "сарай 1, 2 и 3")
      if (section.words[0] === cardinalNumberNodes[0]) {
        throw new AddressInterpretationError(
          "Unexpected cardinal number in house part section",
        );
      }

      // Ensure section does not contain more than one cardinal number (could be the case of enumeration like "сарай 1, 2 3")
      if (cardinalNumberNodes.length > 2) {
        throw new AddressInterpretationError(
          "Unexpected multiple cardinal numbers in house part section",
        );
      }

      // Ensure section does not start with an unclassified word (e.g. "Б 42")
      if (section.words[0]?.wordType === "unclassified") {
        throw new AddressInterpretationError(
          "Unexpected unclassified word at the beginning of the section",
        );
      }

      // Ensure the sections are subsequent (e.g. __x__xx_ is not OK)
      if (prevSection && section.index - prevSection.index !== 1) {
        throw new AddressInterpretationError(
          "Expected house part sections to be subsequent",
        );
      }
    }

    // Ensure firstSection follows the last house section
    if (
      (housePartSections[0]?.index ?? 0) - 1 !==
      (houseSections[houseSections.length - 1]?.index ?? 0)
    ) {
      throw new AddressInterpretationError(
        "Expected house part sections to be after house sections",
      );
    }

    const wordsInHousePart: AddressNodeWithWord[] = [];
    for (const section of housePartSections) {
      const wordsToAdd = section.words;
      wordsInHousePart.push(...wordsToAdd);
    }

    if (
      wordsInHousePart.some(
        (wordToAdd) =>
          wordToAdd.wordType !== "designation" &&
          wordToAdd.wordType !== "cardinalNumber" &&
          !(
            wordToAdd.wordType === "unclassified" &&
            wordToAdd.value.length === 1
          ),
      )
    ) {
      throw new AddressInterpretationError(
        "Expected house part sections only contain designations, numbers or single letters",
      );
    }

    if (wordsInHousePart.length > 0) {
      housePart = {
        nodeType: "semanticPart",
        orderedWords: wordsInHousePart,
      };
    }
  }

  // Add default region
  if (!region && config.defaultRegion) {
    const regionSection = extractSections(
      buildCleanedAddressAst(config.defaultRegion, {}),
    )[0];
    if (regionSection) {
      region = convertSectionToSemanticPart(regionSection);
    }
  }

  if (!region) {
    throw new AddressInterpretationError(`Missing region`);
  }

  if (!settlement) {
    throw new AddressInterpretationError(`Missing settlement`);
  }
  if (!streets) {
    throw new AddressInterpretationError(`Missing streets`);
  }
  if (!houses) {
    throw new AddressInterpretationError(`Missing houses`);
  }

  return {
    nodeType: "standardizedAddress",
    region,
    settlement,
    streets,
    houses,
    housePart,
  };
};
