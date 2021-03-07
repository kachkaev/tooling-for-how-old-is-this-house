export type Gender = "f" | "m" | "n";

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

export interface DesignationConfig {
  normalizedValue: string;
  aliases?: Readonly<string[]>;
  designation: Designation;
  gender: Gender;
}

export interface DesignationAdjectiveConfig {
  normalizedNameByGender: Record<Gender, string>;
  aliases: string[];
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

export interface AddressNodeWithNumber extends AddressWordBase {
  wordType:
    | "cardinalNumber" // 1, 42А
    | "ordinalNumber"; // 1-я, 2-й
  number: number;
  ending: string;
}

export type AddressNodeWithWord =
  | AddressNodeWithNumber
  | AddressNodeWithDesignation
  | AddressNodeWithDesignationAdjective
  | AddressNodeWithInitial
  | AddressNodeWithUnclassifiedWord;

export interface AddressNodeWithSeparator {
  nodeType: "separator";
  separatorType: "comma" | "slash";
}

export type CleanedAddressNode = AddressNodeWithWord | AddressNodeWithSeparator;
export interface CleanedAddressAst {
  nodeType: "cleanedAddress";
  children: CleanedAddressNode[];
}

export interface AddressNodeWithSegment {
  nodeType: "segment";
  designation?: Designation;
  words: AddressNodeWithWord[];
}

export interface StandardizedAddressAst {
  nodeType: "standardizedAddress";
  segments: AddressNodeWithSegment[];
}

/*

atomic token
token

normalized:
1. cleaned (always possible)
2. standardized (if possible)

*/
