import _ from "lodash";

import { AddressInterpretationError } from "./AddressInterpretationError";
import { buildSectionedAddressAst } from "./buildSectionedAddressAst";
import { convertSectionToSemanticPart } from "./convertSectionToSemanticPart";
import { getDesignationConfig } from "./helpersForDesignations";
import { resolveRegionCode } from "./helpersForRegions";
import { orderedSectionTypes } from "./helpersForStandardization";
import {
  AddressNodeWithSection,
  AddressNodeWithSemanticPart,
  CleanedAddressAst,
  SemanticPartType,
  StandardizedAddressAst,
} from "./types";

export const buildStandardizedAddressAst = (
  cleanedAddressAst: CleanedAddressAst,
): StandardizedAddressAst => {
  const sectionedAddressAst = buildSectionedAddressAst(cleanedAddressAst);

  const semanticPartLookup: Partial<
    Record<SemanticPartType, AddressNodeWithSemanticPart>
  > = {};

  const sections = sectionedAddressAst.sections;
  const remainingSections: AddressNodeWithSection[] = [];

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
      section.words[0].wordType === "cardinalNumber" &&
      sections[1]?.designation !== "street" &&
      sections[1]?.designation !== "place"
    ) {
      semanticPartLookup.region = resolveRegionCode(section.words[0].value);
      continue;
    }

    // Ignore country
    if (
      section.designation === "country" ||
      (section.words.length === 1 && section.words[0].value === "россия")
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
        remainingSections[sectionIndex]?.index -
          remainingSections[sectionIndex - 1]?.index !==
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
