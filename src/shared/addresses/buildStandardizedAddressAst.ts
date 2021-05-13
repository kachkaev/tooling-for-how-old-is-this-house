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
  AddressSection,
  BuildStandardizedAddressAstConfig,
  CleanedAddressAst,
  SemanticPartType,
  StandardizedAddressAst,
} from "./types";

export const buildStandardizedAddressAst = (
  cleanedAddressAst: CleanedAddressAst,
  config: BuildStandardizedAddressAstConfig = {},
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
    }

    // Stop if the only word in the section is designation (does not make sense)
    if (section.words.length === 1 && section.designation) {
      // Common special case: "территория гск", "территория снт" etc.
      if (section.words[0]?.value === "территория") {
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
        // Skip (case of corner buildings)
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

    const orderedWords = _.flatMap(
      remainingSections,
      (section) => section.words,
    );
    if (
      orderedWords[0]?.wordType === "designation" &&
      getDesignationConfig(orderedWords[0]).designation === "house"
    ) {
      orderedWords.shift();
    }

    // Remove second addresses in corner buildings
    if (
      orderedWords[0]?.wordType === "cardinalNumber" &&
      orderedWords[1]?.wordType === "cardinalNumber"
    ) {
      orderedWords.splice(1, 1);
    }

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
