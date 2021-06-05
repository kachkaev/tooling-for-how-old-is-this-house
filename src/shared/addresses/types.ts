export type Gender = "f" | "m" | "n";

export interface ProtoWordConfig {
  normalizedValue?: string;
  beautifiedValue?: string;
  aliases?: Readonly<string[]>;
}

export interface WordConfig extends ProtoWordConfig {
  normalizedValue: string;
}

export type Designation =
  | "country"
  | "region"
  | "county"
  | "settlement"
  | "place"
  | "district"
  | "street"
  | "house"
  | "housePart";

export interface DesignationConfig extends WordConfig {
  designation: Designation;
  gender: Gender;
  canBePartOfName?: boolean;
  canBeSkippedIfAloneInSection?: boolean;
  alwaysGoesBeforeName?: boolean;
}

export interface DesignationAdjectiveConfig extends ProtoWordConfig {
  normalizedValueByGender: Record<Gender, string>;
}
export interface ApproximatePointerConfig extends WordConfig {
  prepositionBefore?: string;
  prepositionAfter?: string;
}

export interface OrdinalNumberEndingConfig extends WordConfig {
  gender: Gender;
}

export type OrdinalNumberTextualNotationConfig = WordConfig;

export interface CommonUnclassifiedWordConfig extends WordConfig {
  ignored?: true | Designation[];
  canBeInStandardizedAddress?: boolean;
}

type GenericAddressToken<T extends string> = [type: T, value: string];

export type AtomicAddressTokenType =
  | "letterSequence"
  | "numberSequence"
  // punctuation
  | "bracket"
  | "comma"
  | "dash"
  | "period"
  | "spacing"
  | "numberSign"
  | "quote"
  | "slash"
  // rest
  | "unknown";

export type AtomicAddressToken = GenericAddressToken<AtomicAddressTokenType>;

export type AddressTokenType = AtomicAddressTokenType | "protoWord";
export type AddressToken = GenericAddressToken<AddressTokenType>;

export interface AddressWordBase {
  nodeType: "word";
  value: string;
}

export interface AddressNodeWithUnclassifiedWord extends AddressWordBase {
  wordType: "unclassified";
}

export interface AddressNodeWithInitial extends AddressWordBase {
  wordType: "initial";
}

export interface AddressNodeWithDesignation extends AddressWordBase {
  wordType: "designation";
}

export interface AddressNodeWithDesignationAdjective extends AddressWordBase {
  wordType: "designationAdjective";
}

export interface AddressNodeWithApproximatePointer extends AddressWordBase {
  wordType: "approximatePointer";
}

export interface AddressNodeWithNumber extends AddressWordBase {
  wordType:
    | "cardinalNumber" // 1, 42А
    | "ordinalNumber" // 1-я, 2-й
    | "unclassifiedNumber"; // 30-летия
  number: number;
  ending: string;
}

export type AddressNodeWithWord =
  | AddressNodeWithNumber
  | AddressNodeWithDesignation
  | AddressNodeWithDesignationAdjective
  | AddressNodeWithApproximatePointer
  | AddressNodeWithInitial
  | AddressNodeWithUnclassifiedWord;

export interface AddressNodeWithSeparator {
  nodeType: "separator";
  separatorType: "comma" | "slash" | "dash";
}

export type CleanedAddressNode = AddressNodeWithWord | AddressNodeWithSeparator;
export interface CleanedAddressAst {
  nodeType: "cleanedAddress";
  children: CleanedAddressNode[];
}

export interface AddressSection {
  index: number;
  designation?: Designation;
  words: AddressNodeWithWord[];
  separatorBefore?: AddressNodeWithSeparator;
}

export type SemanticPartType = "region" | "settlement" | "street" | "building";

export interface AddressNodeWithSemanticPart {
  nodeType: "semanticPart";
  orderedWords: AddressNodeWithWord[];
}

export interface StandardizedAddressAst {
  nodeType: "standardizedAddress";
  semanticPartLookup: Record<SemanticPartType, AddressNodeWithSemanticPart>;
}

export interface BuildStandardizedAddressAstConfig {
  defaultRegion?: string;
  canonicalSpellings?: string[];
}

export interface FinalizeWordSpelling {
  (word: AddressNodeWithWord): string;
}

export interface ReorderWordsInSection {
  (words: AddressNodeWithWord[]): AddressNodeWithWord[];
}

export type AddressNormalizationConfig = BuildStandardizedAddressAstConfig;
