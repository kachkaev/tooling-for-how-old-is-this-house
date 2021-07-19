export type Gender = "f" | "m" | "n";

export interface ProtoWordConfig {
  normalizedValue?: string;
  beautifiedValue?: string;
  aliases?: Readonly<string[]>;
}

export interface WordConfig extends ProtoWordConfig {
  normalizedValue: string;
  wordReplacements?: Readonly<string[]>;
}

export type Designation =
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
    | "postCode" // 440000
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

export interface WordReplacementConfig {
  detached?: boolean;
  from: string | string[];
  to: string;
}

export interface WordReplacementDirective {
  detached: boolean;
  from: AddressNodeWithUnclassifiedWord[];
  to: AddressNodeWithUnclassifiedWord[];
}

export interface WordReplacementDirectiveTree {
  directive?: WordReplacementDirective;
  subtreeByWordValue: Record<string, WordReplacementDirectiveTree>;
}

export interface AddressCleaningConfig {
  wordReplacementDirectiveTree?: WordReplacementDirectiveTree;
}

export interface AddressSection {
  index: number;
  designation?: Designation;
  words: AddressNodeWithWord[];
  separatorBefore?: AddressNodeWithSeparator;
}

export interface AddressNodeWithSemanticPart {
  nodeType: "semanticPart";
  orderedWords: AddressNodeWithWord[];
}

export interface StandardizedAddressAst {
  nodeType: "standardizedAddress";
  region: AddressNodeWithSemanticPart;
  settlement: AddressNodeWithSemanticPart;
  streets: [AddressNodeWithSemanticPart, ...AddressNodeWithSemanticPart[]];
  houses: [AddressNodeWithSemanticPart, ...AddressNodeWithSemanticPart[]];
  housePart: AddressNodeWithSemanticPart | undefined;
}

export interface AddressStandardizationConfig {
  defaultRegion?: string;
}

export interface PostProcessWordsInStandardizedAddressSection {
  (words: AddressNodeWithWord[]): AddressNodeWithWord[];
}

export interface FinalizeWordSpelling {
  (word: AddressNodeWithWord, neighboringWords: AddressNodeWithWord[]): string;
}

export interface AddressNormalizationConfig
  extends AddressCleaningConfig,
    AddressStandardizationConfig {}

export interface AddressBeautificationConfig
  extends AddressNormalizationConfig {
  canonicalSpellings?: string[];
}

export interface RawAddressHandlingConfig {
  canonicalSpellings?: string[];
  defaultRegion?: string;
  wordReplacements?: WordReplacementConfig[];
}

export type AddressHandlingConfig = AddressBeautificationConfig;
