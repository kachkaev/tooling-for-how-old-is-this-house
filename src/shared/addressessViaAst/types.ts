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

export type Gender = "m" | "f" | "n";

export interface DesignationWordConfig {
  aliases?: Readonly<string[]>;
  designation: Designation;
  gender: Gender;
}

export interface DesignationAdjectiveConfig {
  normalizedNameByGender: Record<Gender, string>;
  aliases: string[];
}

type GenericAddressToken<T extends string> = [type: T, value: string];

export type SimpleAddressTokenType =
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

export type SimpleAddressToken = GenericAddressToken<SimpleAddressTokenType>;

export type AddressTokenType = SimpleAddressTokenType | "protoWord";
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
  meta: DesignationWordConfig;
}

export interface AddressNodeWithCardinalNumber extends AddressWordBase {
  wordType: "cardinalNumber"; // 1, 42А
}
export interface AddressNodeWithOrdinalNumber extends AddressWordBase {
  wordType: "ordinalNumber"; // 1-я, 2-й
}

export interface AddressNodeWithDesignationAdjective extends AddressWordBase {
  wordType: "designationAdjective";
  meta: DesignationAdjectiveConfig;
}

export type AddressNodeWithWord =
  | AddressNodeWithCardinalNumber
  | AddressNodeWithDesignation
  | AddressNodeWithDesignationAdjective
  | AddressNodeWithInitial
  | AddressNodeWithOrdinalNumber
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
lexical token

Flat AST
Node: word / separator

normalized
standardized

*/
