import _ from "lodash";

import { AddressInterpretationError } from "./AddressInterpretationError";
import { buildCleanedAddressAst } from "./buildCleanedAddressAst";
import { convertSectionToSemanticPart } from "./convertSectionToSemanticPart";
import { extractSections } from "./extractSections";
import { getDesignationConfig } from "./helpersForDesignations";
import { resolveRegionCode } from "./helpersForRegions";
import { orderedSectionTypes } from "./helpersForStandardization";
import {
  AddressNodeWithSemanticPart,
  AddressNodeWithWord,
  AddressSection,
  BuildStandardizedAddressAstConfig,
  CleanedAddressAst,
  SemanticPartType,
  StandardizedAddressAst,
} from "./types";

export const buildStandardizedAddressAst = (
  cleanedAddressAst: CleanedAddressAst,
  config: BuildStandardizedAddressAstConfig,
): StandardizedAddressAst => {
  const sections = extractSections(cleanedAddressAst);

  const semanticPartLookup: Partial<
    Record<SemanticPartType, AddressNodeWithSemanticPart>
  > = {};

  const remainingSections: AddressSection[] = [];

  for (
    let sectionIndex = 0;
    sectionIndex < sections.length;
    sectionIndex += 1
  ) {
    const section = sections[sectionIndex]!;

    // Special case: cardinal number in first section is region code, if not followed by street / place
    if (
      sectionIndex === 0 &&
      !section.designation &&
      section.words.length === 1 &&
      section.words[0]?.wordType === "cardinalNumber" &&
      sections[1]?.designation !== "street" &&
      sections[1]?.designation !== "place"
    ) {
      semanticPartLookup.region = resolveRegionCode(section.words[0].value);
      continue;
    }

    // Ignore country (assume Russia)
    if (
      section.designation === "country" ||
      (section.words.length === 1 &&
        (section.words[0]?.value === "россия" ||
          section.words[0]?.value === "рф"))
    ) {
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

    // Ignore insignificant building parts
    if (section.designation === "housePart") {
      const designationWordValue = section.words?.find(
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
        const sectionWithHouseNumber = remainingSections.find(
          (section2) =>
            section2.designation === "house" || !section2.designation,
        );
        if (!sectionWithHouseNumber) {
          remainingSections.push({
            index: section.index,
            words: section.words.filter((word) => word.value !== "строение"),
          });
          continue;
        }
      }
    }

    // Stop if the only word in the section is designation (does not make sense)
    if (section.words.length === 1 && section.designation) {
      const word = section.words[0];
      if (word?.wordType !== "designation") {
        throw new Error(
          `Unexpected word of type ${word?.wordType} in a section with a single designation word`,
        );
      }

      // special case: "территория гск", "территория снт", "аал снт" (→ "ст снт") etc.
      if (getDesignationConfig(word).canBeSkippedIfAloneInSection) {
        continue;
      }

      throw new AddressInterpretationError(
        `Unexpected section only with designation: ${section.words[0]?.value}`,
      );
    }

    // Region
    if (section.designation === "region") {
      if (semanticPartLookup.region) {
        throw new AddressInterpretationError(
          "Did not expect more than one region",
        );
      }
      semanticPartLookup.region = convertSectionToSemanticPart(section);
      continue;
    }

    // Settlement (designation is explicit)
    if (section.designation === "settlement") {
      if (semanticPartLookup.settlement) {
        throw new AddressInterpretationError(
          "Did not expect more than one settlement",
        );
      }
      semanticPartLookup.settlement = convertSectionToSemanticPart(section);
      continue;
    }

    // Settlement (designation is omitted)
    if (
      !section.designation &&
      !section.words.find((word) => word.wordType === "cardinalNumber")
    ) {
      if (semanticPartLookup.settlement) {
        throw new AddressInterpretationError(
          "Did not expect more than one settlement",
        );
      }
      semanticPartLookup.settlement = convertSectionToSemanticPart(section);
      continue;
    }

    // Place (settlement or street)
    if (section.designation === "place") {
      if (!semanticPartLookup.settlement) {
        semanticPartLookup.settlement = convertSectionToSemanticPart(section);
      } else if (!semanticPartLookup.street) {
        semanticPartLookup.street = convertSectionToSemanticPart(section);
      } else {
        // Skip (case of corner buildings)
      }
      continue;
    }

    // Street
    if (section.designation === "street") {
      if (semanticPartLookup.street) {
        // Skip
        // TODO: better handle case of corner buildings
        continue;
      }

      semanticPartLookup.street = convertSectionToSemanticPart(section);
      continue;
    }

    remainingSections.push(section);
  }

  // Assemble building part out of the remaining sections
  if (remainingSections.length) {
    // Ensure the remaining sections are subsequent (e.g. __x__xx_ is not OK)
    for (
      let sectionIndex = 1;
      sectionIndex < remainingSections.length;
      sectionIndex += 1
    ) {
      if (
        (remainingSections[sectionIndex]?.index ?? 0) -
          (remainingSections[sectionIndex - 1]?.index ?? 0) !==
        1
      ) {
        throw new AddressInterpretationError(
          "Expected remaining sections to be subsequent",
        );
      }
    }

    const orderedWords: AddressNodeWithWord[] = [];
    let houseSectionAlreadyFound = false;
    remainingSections.forEach((section) => {
      let wordsToAdd = section.words;
      const firstWordInSection = section.words[0];

      // Remove house designation word
      if (
        firstWordInSection?.wordType === "designation" &&
        getDesignationConfig(firstWordInSection).designation === "house"
      ) {
        // if designation is not followed by a number, fail (e.g. typos like ‘уч. Мясницкая’)
        const nextWord = wordsToAdd[1];
        if (
          nextWord?.nodeType !== "word" ||
          nextWord?.wordType !== "cardinalNumber"
        ) {
          throw new AddressInterpretationError(
            `Expected cardinal number after ${firstWordInSection?.value}, got ${nextWord?.value}`,
          );
        }
        wordsToAdd = wordsToAdd.slice(1);
      }

      const isHouseSection =
        wordsToAdd.length === 1 && wordsToAdd[0]?.wordType === "cardinalNumber";

      // Remove second house number in corner buildings (if separated by slash)
      if (section.separatorBefore?.separatorType === "slash") {
        if (isHouseSection && houseSectionAlreadyFound) {
          return;
        }
        throw new AddressInterpretationError(
          "Unexpected / not after another house number",
        );
      }

      if (isHouseSection && houseSectionAlreadyFound) {
        throw new AddressInterpretationError(
          "Only one house number is supported",
        );
      }

      houseSectionAlreadyFound = true;

      orderedWords.push(...wordsToAdd);
    });

    semanticPartLookup.building = {
      nodeType: "semanticPart",
      orderedWords,
    };
  }

  // Add default region
  if (!semanticPartLookup.region && config.defaultRegion) {
    const regionSection = extractSections(
      buildCleanedAddressAst(config.defaultRegion),
    )[0];
    if (regionSection) {
      semanticPartLookup.region = convertSectionToSemanticPart(regionSection);
    }
  }

  const foundSectionTypes = Object.keys(semanticPartLookup);
  if (foundSectionTypes.length < orderedSectionTypes.length) {
    throw new AddressInterpretationError(
      `Missing ${_.difference(orderedSectionTypes, foundSectionTypes).join(
        ", ",
      )}`,
    );
  }

  return {
    nodeType: "standardizedAddress",
    semanticPartLookup: semanticPartLookup as Record<
      SemanticPartType,
      AddressNodeWithSemanticPart
    >,
  };
};
