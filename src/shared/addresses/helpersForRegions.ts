import { AddressInterpretationError } from "./AddressInterpretationError";
import { buildCleanedAddressAst } from "./buildCleanedAddressAst";
import { buildSectionedAddressAst } from "./buildSectionedAddressAst";
import { convertSectionToSemanticPart } from "./convertSectionToSemanticPart";
import { AddressNodeWithSemanticPart } from "./types";

type RawRegion = [code: number, rawName: string];

const rawRegions: RawRegion[] = [
  // TODO: Add more regions
  [58, "пензенская область"],
];

export const regionByCode: Record<
  string,
  AddressNodeWithSemanticPart | undefined
> = {};

rawRegions.forEach(([code, rawName]) => {
  const sectionedAddressAst = buildSectionedAddressAst(
    buildCleanedAddressAst(rawName),
  );
  const sectionNode = sectionedAddressAst.sections[0];
  if (!sectionNode) {
    throw new Error(`Unexpected empty result for ${code} → ${rawName}`);
  }
  regionByCode[code] = convertSectionToSemanticPart(sectionNode);
});

export const resolveRegionCode = (
  regionCode: string,
): AddressNodeWithSemanticPart => {
  const result = regionByCode[regionCode];
  if (!result) {
    throw new AddressInterpretationError(
      `Unable to find region for region code ${regionCode}`,
    );
  }

  return result;
};
