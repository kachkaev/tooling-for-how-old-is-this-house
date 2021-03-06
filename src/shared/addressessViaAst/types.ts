import { DesignationConfig } from "../addresses/types";

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
  aliases?: string[];
  designation: Designation;
  gender: Gender;
}

export interface DesignationAdjectiveConfig {
  normalizedNameByGender: Record<Gender, string>;
  aliases: string[];
}

export type AddressTokenType =
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

export interface AddressToken {
  type: AddressTokenType;
  value: string;
}

export interface ProtoWord {
  type: "protoWord";
  value: string;
}

export type AddressTokenOrProtoWord = AddressToken | ProtoWord;

export interface AddressWordBase {
  type: "word";
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
  designationConfig: DesignationConfig;
}

export interface AddressNodeWithCardinalNumber extends AddressWordBase {
  wordType: "cardinalNumber"; // 1, 42А
}
export interface AddressNodeWithOrdinalNumber extends AddressWordBase {
  wordType: "ordinalNumber"; // 1-я, 2-й
}

export interface AddressNodeWithDesignationAdjective extends AddressWordBase {
  wordType: "designationAdjective";
  designationAdjectiveConfig: DesignationAdjectiveConfig;
}

type AddressNodeWithWord =
  | AddressNodeWithCardinalNumber
  | AddressNodeWithDesignation
  | AddressNodeWithInitial
  | AddressNodeWithOrdinalNumber
  | AddressNodeWithUnclassifiedWord
  | AddressNodeWithDesignationAdjective;

export interface AddressNodeWithSegment {
  type: "segment";
  designation?: Designation;
  words: AddressNodeWithWord[];
}

export interface AddressAst {
  segments: AddressNodeWithSegment[];
}
